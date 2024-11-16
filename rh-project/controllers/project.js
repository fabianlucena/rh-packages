import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, HttpError, getUuidFromRequest, makeContext } from 'http-util';
import { checkParameter, sanitizeFields } from 'rf-util';
import { Controller } from 'rh-controller';
import { dependency } from 'rf-dependency';

export class ProjectController extends Controller {
  constructor() {
    super();

    this.service =        dependency.get('projectService');
    this.companyService = dependency.get('companyService', null);
  }

  async checkDataForCompanyId(data, context) {
    if (!conf.filters?.companyId) {
      return;
    }
         
    data ??= {};
    if (!data.companyId) {
      if (data.companyUuid) {
        data.companyId = await this.companyService.getSingleIdForUuid(data.companyUuid);
      } else if (data.companyName) {
        data.companyId = await this.companyService.getSingleIdForName(data.companyName);
      } else {
        data.companyId = await conf.filters?.companyId(context) ?? null;
        return data.companyId;
      }
        
      if (!data.companyId) {
        throw new HttpError(loc => loc._c('project', 'The company does not exist or you do not have permission to access it.'), 404);
      }
    }

    const companyId = await conf.filters?.companyId(context) ?? null;
    if (data.companyId != companyId) {
      throw new HttpError(loc => loc._c('project', 'The company does not exist or you do not have permission to access it.'), 403);
    }

    return data.companyId;
  }

  async checkUuid(context) {
    const uuid = await getUuidFromRequest(context.req);
    const project = await this.service.getSingleOrNullForUuid(uuid, { skipNoRowsError: true, loc: context.loc });
    if (!project) {
      throw new HttpError(loc => loc._c('project', 'The project with UUID %s does not exists.'), 404, uuid);
    }

    const companyId = await this.checkDataForCompanyId({ companyId: project.companyId }, context);

    return { uuid, companyId };
  }

  postPermission = 'project.create';
  async post(req, res) {
    checkParameter(
      req?.body,
      {
        name:  loc => loc._c('project', 'Name'),
        title: loc => loc._c('project', 'Title'),
      },
    );
        
    const data = { ...req.body };
    await this.checkDataForCompanyId(data, makeContext(req, res));
    if (!data.owner && !data.ownerId) {
      data.ownerId = req.user.id;
      if (!data.ownerId) {
        throw new HttpError(loc => loc._c('project', 'The project data does not have a owner.'));
      }
    }

    await this.service.create(data);

    res.status(204).send();
  }

  getPermission = 'project.get';
  async getData(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      loc: req.loc,
      include: { owner: true },
    };

    if (this.companyService) {
      options.include = {
        company: true,
        ...options.include,
      };
    }

    const context = makeContext(req, res);
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.companyId) {
      options.where ??= {};
      options.where.companyId = await conf.filters?.companyId(context) ?? null;
    }

    const eventOptions = { entity: 'Project', context, options };
    await conf.global.eventBus?.$emit('Project.response.getting', eventOptions);
    await conf.global.eventBus?.$emit('response.getting', eventOptions);

    const result = await this.service.getListAndCount(options);

    if (this.companyService) {
      result.rows = result.rows.map(row => {
        row.companyUuid = row.company.uuid;

        return row;
      });
    }

    await conf.global.eventBus?.$emit('Project.response.getted', { ...eventOptions, result });
    await conf.global.eventBus?.$emit('response.getted', { ...eventOptions, result });

    res.status(200).send(result);
  }

  async getGrid(req) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('project.create')) actions.push('create');
    if (req.permissions.includes('project.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('project.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    const loc = req.loc;
    const columns = [
      {
        name: 'title',
        type: 'text',
        label: await loc._c('project', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._c('project', 'Name'),
      },
    ];

    if (this.companyService) {
      columns.push({
        name: 'company.title',
        type: 'text',
        label: await loc._c('project', 'Company'),
      });
    }

    columns.push(
      {
        name: 'owner.user.displayName',
        type: 'text',
        label: await loc._c('project', 'Owner'),
      },
      {
        name: 'description',
        type: 'textArea',
        label: await loc._c('project', 'Description'),
        placeholder: await loc._c('project', 'Description'),
      }
    );

    const grid = {
      title: await loc._c('projects', 'Projects'),
      load: {
        service: 'project',
        method: 'get',
      },
      actions,
      columns: await sanitizeFields(
        columns,
        {
          loc,
          entity: 'Project',
          translationContext: 'project',
          interface: 'grid',
          ...conf?.project, 
        },
      ),
    };

    return grid;
  }

  async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc;
    const fields = [
      {
        name: 'title',
        type: 'text',
        label: await loc._c('project', 'Title'),
        placeholder: await loc._c('project', 'Title'),
        required: true,
        onValueChanged: {
          mode: {
            create: true,
            defaultValue: false,
          },
          action: 'setValues',
          override: false,
          map: {
            name: {
              source: 'title',
              sanitize: 'dasherize',
            },
          },
        },
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._c('project', 'Name'),
        placeholder: await loc._c('project', 'Name'),
        required: true,
        disabled: {
          create: false,
          defaultValue: true,
        },
      },
    ];

        
    if (this.companyService) {
      fields.push({
        name: 'company.uuid',
        type: 'select',
        label: await loc._c('project', 'Company'),
        placeholder: await loc._c('project', 'Company'),
        required: true,
        loadOptionsFrom: {
          service: 'project/company',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      });
    }

    fields.push({
      name: 'isEnabled',
      type: 'checkbox',
      label: await loc._c('project', 'Enabled'),
      placeholder: await loc._c('project', 'Enabled'),
      value: true,
    },
    {
      name: 'description',
      type: 'textArea',
      label: await loc._c('project', 'Description'),
      placeholder: await loc._c('project', 'Description'),
    });

    const form = {
      title: await loc._c('project', 'Projects'),
      action: 'project',
      fields: await sanitizeFields(
        fields,
        conf?.project,
        {
          loc,
          entity: 'Project',
          translationContext: 'project',
          interface: 'form',
        },
      ),
    };

    const context = makeContext(req, res),
      eventOptions = { entity: 'Project', form, context, loc: context.loc };
    await conf.global.eventBus?.$emit('Project.interface.form.get', eventOptions);
    await conf.global.eventBus?.$emit('interface.form.get', eventOptions);
        
    res.status(200).send(form);
  }

  deleteForUuidPermission =      'project.delete';
  postEnableForUuidPermission =  'project.edit';
  postDisableForUuidPermission = 'project.edit';

  'patchPermission /:uuid' = 'project.edit';
  'patchPermission' = 'project.edit';
  async 'patch /:uuid'(req, res) {
    const { uuid, companyId } = await this.checkUuid(makeContext(req, res));

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    if (companyId) {
      where.companyId = companyId;
    }

    const rowsUpdated = await this.service.updateFor(data, where);
    if (!rowsUpdated) {
      throw new HttpError(loc => loc._c('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async 'patch'(req, res) {
    const { uuid, companyId } = await this.checkUuid(makeContext(req, res));

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    if (companyId) {
      where.companyId = companyId;
    }

    const rowsUpdated = await this.service.updateFor(data, where);
    if (!rowsUpdated) {
      throw new HttpError(loc => loc._c('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  'getPermission /company' = 'project.edit';
  async 'get /company'(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      loc: req.loc,
      view: true,
      limit: 10,
      offset: 0,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.companyId) {
      options.where ??= {};
      options.where.id = await conf.filters?.companyId(makeContext(req, res)) ?? null;
    }

    const result = await this.companyService.getListAndCount(options);

    res.status(200).send(result);
  }
}