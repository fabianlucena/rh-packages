import { ProjectService } from '../services/project.js';
import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError, getUuidFromRequest } from 'http-util';
import { checkParameter, filterVisualItemsByAliasName } from 'rf-util';
import { loc, defaultLoc } from 'rf-locale';

const projectService = ProjectService.singleton();

export class ProjectController {
  static async checkDataForCompanyId(req, data) {
    if (!conf.filters?.getCurrentCompanyId) {
      return;
    }
         
    data ??= {};
    if (!data.companyId) {
      if (data.companyUuid) {
        data.companyId = await conf.global.services.Company.singleton().getIdForUuid(data.companyUuid);
      } else if (data.companyName) {
        data.companyId = await conf.global.services.Company.singleton().getIdForName(data.companyName);
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

  static async checkUuid(req) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const project = await projectService.getForUuid(uuid, { skipNoRowsError: true, loc });
    if (!project) {
      throw new _HttpError(loc._cf('project', 'The project with UUID %s does not exists.'), 404, uuid);
    }

    const companyId = await ProjectController.checkDataForCompanyId(req, { companyId: project.companyId });

    return { uuid, companyId };
  }

  static async post(req, res) {
    const loc = req.loc ?? defaultLoc;
    checkParameter(req?.body, { name: loc._cf('project', 'Name'), title: loc._cf('project', 'Title') });
        
    const data = { ...req.body };
    await ProjectController.checkDataForCompanyId(req, data);
    if (!data.owner && !data.ownerId) {
      data.ownerId = req.user.id;
      if (!data.ownerId) {
        throw new _HttpError(loc._cf('project', 'The project data does not have a owner.'));
      }
    }

    await projectService.create(data);

    res.status(204).send();
  }

  static async get(req, res) {
    if ('$grid' in req.query) {
      return ProjectController.getGrid(req, res);
    } else if ('$form' in req.query) {
      return ProjectController.getForm(req, res);
    }

    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      loc: req.loc,
      includeOwner: true,
    };

    if (conf.global.models.Company) {
      options.includeCompany = true;
    }

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    await conf.global.eventBus?.$emit('Project.response.getting', options);

    const result = await projectService.getListAndCount(options);

    if (conf.global.models.Company) {
      result.rows = result.rows.map(row => {
        row.companyUuid = row.Company.uuid;

        return row;
      });
    }

    await conf.global.eventBus?.$emit('Project.response.getted', result, options);

    res.status(200).send(result);
  }

  static async getGrid(req, res) {
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
        name: 'Company.title',
        type: 'text',
        label: await loc._cf('project', 'Company'),
      });
    }

    columns.push(
      {
        alias: 'owner',
        name: 'Collaborators[0].User.displayName',
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
      title: await loc._('Projects'),
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

  static async getForm(req, res) {
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
      title: await loc._('Projects'),
      action: 'project',
      fields: await filterVisualItemsByAliasName(fields, conf?.project, { loc, entity: 'Project', interface: 'form' }),
    };

    await conf.global.eventBus?.$emit('Project.interface.form.get', form, { loc });
    await conf.global.eventBus?.$emit('interface.form.get', form, { loc, entity: 'Project' });
        
    res.status(200).send(form);
  }

  static async delete(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsDeleted = await projectService.deleteForUuid(uuid);
    if (!rowsDeleted) {
      throw new _HttpError(loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async enablePost(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsUpdated = await projectService.enableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async disablePost(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsUpdated = await projectService.disableForUuid(uuid);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async patch(req, res) {
    const { uuid, companyId } = await this.checkUuid(req);

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    if (companyId) {
      where.companyId = companyId;
    }

    const rowsUpdated = await projectService.updateFor(data, where);
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  static async getCompany(req, res) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    const result = await conf.global.services.Company.singleton().getListAndCount(options);

    const loc = req.loc ?? defaultLoc;
    result.rows = result.rows.map(row => {
      if (row.isTranslatable) {
        row.title = loc._(row.title);
        row.description = loc._(row.description);
        delete row.isTranslatable;
      }

      return row;
    });

    res.status(200).send(result);
  }
}