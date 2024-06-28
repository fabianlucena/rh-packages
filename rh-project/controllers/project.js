import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError, getUuidFromRequest } from 'http-util';
import { checkParameter, filterVisualItemsByAliasName } from 'rf-util';
import { loc, defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';
import { dependency } from 'rf-dependency';

export class ProjectController extends Controller {
  constructor() {
    super();

    this.service = dependency.get('projectService');
    this.companyService = dependency.get('companyService', null);
  }

  async checkDataForCompanyId(req, data) {
    if (!conf.filters?.getCurrentCompanyId) {
      return;
    }
         
    data ??= {};
    if (!data.companyId) {
      if (data.companyUuid) {
        data.companyId = await this.companyService.getIdForUuid(data.companyUuid);
      } else if (data.companyName) {
        data.companyId = await this.companyService.getIdForName(data.companyName);
      } else {
        data.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        return data.companyId;
      }
        
      if (!data.companyId) {
        throw new _HttpError(loc._cf('project', 'The company does not exist or you do not have permission to access it.'), 404);
      }
    }

    const companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    if (data.companyId != companyId) {
      throw new _HttpError(loc._cf('project', 'The company does not exist or you do not have permission to access it.'), 403);
    }

    return data.companyId;
  }

  async checkUuid(req) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const project = await this.service.getForUuid(uuid, { skipNoRowsError: true, loc });
    if (!project) {
      throw new _HttpError(loc._cf('project', 'The project with UUID %s does not exists.'), 404, uuid);
    }

    const companyId = await this.checkDataForCompanyId(req, { companyId: project.companyId });

    return { uuid, companyId };
  }

  postPermission = 'project.create';
  async post(req, res) {
    const loc = req.loc ?? defaultLoc;
    checkParameter(req?.body, { name: loc._cf('project', 'Name'), title: loc._cf('project', 'Title') });
        
    const data = { ...req.body };
    await this.checkDataForCompanyId(req, data);
    if (!data.owner && !data.ownerId) {
      data.ownerId = req.user.id;
      if (!data.ownerId) {
        throw new _HttpError(loc._cf('project', 'The project data does not have a owner.'));
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

    if (conf.global.models.Company) {
      options.include = {
        company: true,
        ...options.include,
      };
    }

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    await conf.global.eventBus?.$emit('Project.response.getting', options);

    const result = await this.service.getListAndCount(options);

    if (conf.global.models.Company) {
      result.rows = result.rows.map(row => {
        row.companyUuid = row.company.uuid;

        return row;
      });
    }

    await conf.global.eventBus?.$emit('Project.response.getted', result, options);

    res.status(200).send(result);
  }

  async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('project.create')) actions.push('create');
    if (req.permissions.includes('project.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('project.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;
    const columns = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('project', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._cf('project', 'Name'),
      },
    ];

    if (conf.global.models.Company) {
      columns.push({
        alias: 'company',
        name: 'company.title',
        type: 'text',
        label: await loc._cf('project', 'Company'),
      });
    }

    columns.push(
      {
        alias: 'owner',
        name: 'owner.user.displayName',
        type: 'text',
        label: await loc._cf('project', 'Owner'),
      },
      {
        name: 'description',
        type: 'textArea',
        label: await loc._cf('project', 'Description'),
        placeholder: await loc._cf('project', 'Description'),
      }
    );

    const grid = {
      title: await loc._c('projects', 'Projects'),
      load: {
        service: 'project',
        method: 'get',
      },
      actions,
      columns: await filterVisualItemsByAliasName(columns, conf?.project, { loc, entity: 'Project', translationContext: 'project', interface: 'grid' }),
    };

    await conf.global.eventBus?.$emit('Project.interface.grid.get', grid, { loc });
    await conf.global.eventBus?.$emit('interface.grid.get', grid, { loc, entity: 'Project' });

    res.status(200).send(grid);
  }

  async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc ?? defaultLoc;
    const fields = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('project', 'Title'),
        placeholder: await loc._cf('project', 'Title'),
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
        label: await loc._cf('project', 'Name'),
        placeholder: await loc._cf('project', 'Name'),
        required: true,
        disabled: {
          create: false,
          defaultValue: true,
        },
      },
    ];

        
    if (conf.global.models.Company) {
      fields.push({
        alias: 'company',
        name: 'companyUuid',
        type: 'select',
        label: await loc._cf('project', 'Company'),
        placeholder: await loc._cf('project', 'Company'),
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
      label: await loc._cf('project', 'Enabled'),
      placeholder: await loc._cf('project', 'Enabled'),
      value: true,
    },
    {
      name: 'description',
      type: 'textArea',
      label: await loc._cf('project', 'Description'),
      placeholder: await loc._cf('project', 'Description'),
    });

    const form = {
      title: await loc._c('project', 'Projects'),
      action: 'project',
      fields: await filterVisualItemsByAliasName(fields, conf?.project, { loc, entity: 'Project', interface: 'form' }),
    };

    await conf.global.eventBus?.$emit('Project.interface.form.get', form, { loc });
    await conf.global.eventBus?.$emit('interface.form.get', form, { loc, entity: 'Project' });
        
    res.status(200).send(form);
  }

  deleteForUuidPermission = 'project.delete';
  enableForUuidPermission = 'project.edit';
  disableForUuidPermission = 'project.edit';

  'patchPermission /:uuid' = 'project.edit';
  async 'patch /:uuid'(req, res) {
    const { uuid, companyId } = await this.checkUuid(req);

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    if (companyId) {
      where.companyId = companyId;
    }

    const rowsUpdated = await this.service.updateFor(data, where);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);
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
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    const result = await this.companyService.getListAndCount(options);

    res.status(200).send(result);
  }
}