import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, _HttpError, getUuidFromRequest, makeContext } from 'http-util';
import { checkParameter, filterVisualItemsByAliasName } from 'rf-util';
import { loc, defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class IssueController extends Controller {
  constructor() {
    super();
    this.issueService = dependency.get('issueService');
  }
    
  async checkDataForProjectId(req, data) {
    if (!conf.filters?.getCurrentProjectId) {
      return data.projectId;
    }
         
    data ??= {};
    if (!data.projectId) {
      if (data.projectUuid) {
        data.projectId = await conf.global.services.Project.singleton().getIdForUuid(data.projectUuid);
      } else if (data.projectName) {
        data.projectId = await conf.global.services.Project.singleton().getIdForName(data.projectName);
      } else {
        data.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
        return data.projectId;
      }
        
      if (!data.projectId) {
        throw new _HttpError(loc._cf('issue', 'The project does not exist or you do not have permission to access it.'), 404);
      }
    }

    const projectId = await conf.filters.getCurrentProjectId(req) ?? null;
    if (data.projectId != projectId) {
      throw new _HttpError(loc._cf('issue', 'The project does not exist or you do not have permission to access it.'), 403);
    }

    return data.projectId;
  }

  async checkUuid(req) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const issue = await this.issueService.getForUuid(uuid, { skipNoRowsError: true, loc });
    if (!issue) {
      throw new _HttpError(loc._cf('issue', 'The issue with UUID %s does not exists.'), 404, uuid);
    }

    const projectId = await IssueController.checkDataForProjectId(req, { projectId: issue.projectId });

    return { uuid, projectId };
  }

  async post(req, res) {
    const loc = req.loc ?? defaultLoc;
    checkParameter(req?.body, { name: loc._cf('issue', 'Name'), title: loc._cf('issue', 'Title') });
        
    const data = { ...req.body };
    await IssueController.checkDataForProjectId(req, data);

    await this.issueService.create(data, { context: makeContext(req, res) });

    res.status(204).send();
  }

  async get(req, res) {
    if ('$grid' in req.query) {
      return IssueController.getGrid(req, res);
    } else if ('$form' in req.query) {
      return IssueController.getForm(req, res);
    }

    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      include: {
        Project: true,
        Type: true,
        Priority: true,
        Status: true,
        Workflow: true,
        CloseReason: true,
      },
      loc,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
    }

    await conf.global.eventBus?.$emit('Issue.response.getting', options);

    let result = await this.issueService.getListAndCount(options);

    await conf.global.eventBus?.$emit('Issue.response.getted', result, options);

    result = await this.issueService.sanitize(result);

    res.status(200).send(result);
  }

  async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('issue.create')) actions.push('create');
    if (req.permissions.includes('issue.edit'))   actions.push('enableDisable', 'edit');
    if (req.permissions.includes('issue.delete')) actions.push('delete');
    actions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;
    const columns = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('issue', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._cf('issue', 'Name'),
      },
      {
        alias: 'project',
        name: 'Project.title',
        type: 'text',
        label: await loc._cf('issue', 'Project'),
      },
      {
        alias: 'type',
        name: 'Type.title',
        type: 'text',
        label: await loc._cf('issue', 'Type'),
      },
      {
        alias: 'priority',
        name: 'Priority.title',
        type: 'text',
        label: await loc._cf('issue', 'Priority'),
      },
    ];

    const details = [
      {
        name: 'description',
        type: 'text',
        label: await loc._cf('issue', 'Description'),
      },
      {
        alias: 'closeReason',
        name: 'CloseReason.title',
        type: 'text',
        label: await loc._cf('issue', 'Close reason'),
      },
    ];

    const grid = {
      title: await loc._('Issues'),
      load: {
        service: 'issue',
        method: 'get',
      },
      actions,
      columns: await filterVisualItemsByAliasName(columns, conf?.issue, { loc, entity: 'Issue', translationContext: 'issue', interface: 'grid' }),
      details: await filterVisualItemsByAliasName(details, conf?.issue, { loc, entity: 'Issue', translationContext: 'issue', interface: 'grid' }),
    };

    await conf.global.eventBus?.$emit('Issue.interface.grid.get', grid, { loc });
    await conf.global.eventBus?.$emit('interface.grid.get', grid, { loc, entity: 'Issue' });

    res.status(200).send(grid);
  }

  async getForm(req, res) {
    checkParameter(req.query, '$form');

    const loc = req.loc ?? defaultLoc;
    const fields = [
      {
        name: 'title',
        type: 'text',
        label: await loc._cf('issue', 'Title'),
        placeholder: await loc._cf('issue', 'Title'),
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
        label: await loc._cf('issue', 'Name'),
        placeholder: await loc._cf('issue', 'Name'),
        required: true,
        disabled: {
          create: false,
          defaultValue: true,
        },
      },
      {
        alias: 'project',
        name: 'Project.uuid',
        type: 'select',
        label: await loc._cf('issue', 'Project'),
        placeholder: await loc._cf('issue', 'Project'),
        required: true,
        loadOptionsFrom: {
          service: 'issue/project',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
      {
        alias: 'type',
        name: 'Type.uuid',
        type: 'select',
        label: await loc._cf('issue', 'Type'),
        placeholder: await loc._cf('issue', 'Type'),
        required: true,
        loadOptionsFrom: {
          service: 'issue/type',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
      {
        alias: 'priority',
        name: 'Priority.uuid',
        type: 'select',
        label: await loc._cf('issue', 'Priority'),
        placeholder: await loc._cf('issue', 'Priority'),
        options: [{ value: null, text: '' }],
        loadOptionsFrom: {
          service: 'issue/priority',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
      {
        name: 'isEnabled',
        type: 'checkbox',
        label: await loc._cf('issue', 'Enabled'),
        placeholder: await loc._cf('issue', 'Enabled'),
        value: true,
      },
      {
        name: 'description',
        type: 'textArea',
        label: await loc._cf('issue', 'Description'),
        placeholder: await loc._cf('issue', 'Description'),
      },
      {
        alias: 'closeReason',
        name: 'CloseReason.uuid',
        type: 'select',
        label: await loc._cf('issue', 'Close reason'),
        placeholder: await loc._cf('issue', 'Close reason'),
        options: [{ value: null, text: '' }],
        loadOptionsFrom: {
          service: 'issue/close-reason',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
    ];

    const form = {
      title: await loc._('Issues'),
      action: 'issue',
      fields: await filterVisualItemsByAliasName(fields, conf?.issue, { loc, entity: 'Issue', interface: 'form' }),
    };

    await conf.global.eventBus?.$emit('Issue.interface.form.get', form, { loc });
    await conf.global.eventBus?.$emit('interface.form.get', form, { loc, entity: 'Issue' });
        
    res.status(200).send(form);
  }

  async delete(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsDeleted = await this.issueService.deleteForUuid(uuid);
    if (!rowsDeleted) {
      const loc = req.loc ?? defaultLoc;
      throw new _HttpError(loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async enablePost(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsUpdated = await this.issueService.enableForUuid(uuid);
    if (!rowsUpdated) {
      const loc = req.loc ?? defaultLoc;
      throw new _HttpError(loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async disablePost(req, res) {
    const { uuid } = await this.checkUuid(req);

    const rowsUpdated = await this.issueService.disableForUuid(uuid);
    if (!rowsUpdated) {
      const loc = req.loc ?? defaultLoc;
      throw new _HttpError(loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async patch(req, res) {
    const { uuid, projectId } = await this.checkUuid(req);

    const loc = req.loc ?? defaultLoc;
    const data = { ...req.body, uuid: undefined };
    const where = { uuid, projectId };

    const rowsUpdated = await this.issueService.updateFor(data, where, { context: makeContext(req, res) });
    if (!rowsUpdated) {
      throw new _HttpError(loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async getProject(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentProjectId(req) ?? null;
    }

    const result = await conf.global.services.Project.singleton().getListAndCount(options);

    res.status(200).send(result);
  }

  async getType(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await conf.global.services.IssueType.singleton().getListAndCount(options);

    res.status(200).send(result);
  }

  async getPriority(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await conf.global.services.IssuePriority.singleton().getListAndCount(options);

    res.status(200).send(result);
  }

  async getCloseReason(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await conf.global.services.IssueCloseReason.singleton().getListAndCount(options);

    res.status(200).send(result);
  }
}