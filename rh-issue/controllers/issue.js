import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, HttpError, makeContext } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';
import fileUpload from 'express-fileupload';

const upload = fileUpload({ createParentPath: true });

export class IssueController extends Controller {
  constructor() {
    super();

    this.projectService =          dependency.get('projectService');
    this.issueTypeService =        dependency.get('issueTypeService');
    this.issuePriorityService =    dependency.get('issuePriorityService');
    this.issueCloseReasonService = dependency.get('issueCloseReasonService');
    this.wfWorkflowOfEntityService = dependency.get('wfWorkflowOfEntityService');
    this.wfStatusService =         dependency.get('wfStatusService');
    this.wfTransitionService =     dependency.get('wfTransitionService');
    this.userService =             dependency.get('userService');
    this.wfCaseService =           dependency.get('wfCaseService');
    this.wfBranchService =         dependency.get('wfBranchService');
  }

  async checkDataForProjectId(data, context) {
    if (!conf.filters?.projectId) {
      return data.projectId;
    }
         
    data ??= {};
    if (!data.projectId) {
      if (data.projectUuid) {
        data.projectId = await this.projectService.getSingleIdForUuid(data.projectUuid);
      } else if (data.projectName) {
        data.projectId = await this.projectService.getSingleIdForName(data.projectName);
      } else {
        data.projectId = await conf.filters.projectId(context) ?? null;
        return data.projectId;
      }
        
      if (!data.projectId) {
        throw new HttpError(loc => loc._c('issue', 'The project does not exist or you do not have permission to access it.'), 404);
      }
    }

    const projectId = await conf.filters.projectId(context) ?? null;
    if (data.projectId != projectId) {
      throw new HttpError(loc => loc._c('issue', 'The project does not exist or you do not have permission to access it.'), 403);
    }

    return data.projectId;
  }

  postMiddleware = upload;
  postPermission = 'issue.create';
  async post(req, res) {
    checkParameter(
      req?.body,
      {
        name:  loc => loc._c('issue', 'Name'),
        title: loc => loc._c('issue', 'Title'),
      },
    );
        
    const context = makeContext(req, res);
    const data = { ...req.body };
    await this.checkDataForProjectId(data, context);

    await this.service.create(data, { context });
  }

  getPermission = 'issue.get';
  async getData(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit:  10,
      offset:  0,
      include: {
        project:     true,
        type:        true,
        priority:    true,
        closeReason: true,
        relatedTo:   {
          include: {
            to:           true,
            relationship: true,
          },
        },
        relatedFrom:   {
          include: {
            from:         true,
            relationship: true,
          },
        },
      },
      loc,
    };

    const context = makeContext(req, res);
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.projectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.projectId(context) ?? null;
    }

    const eventOptions = { entity: 'Issue', context, options };
    await conf.global.eventBus?.$emit('Issue.response.getting', eventOptions);
    let result = await this.service.getListAndCount(options);
    await conf.global.eventBus?.$emit('Issue.response.getted', { ...eventOptions, result });
    for (const row of result.rows) {
      row.related = [
        ...row.relatedTo.  map(i => ({ ...i, issue: i.to   })),
        ...row.relatedFrom.map(i => ({ ...i, issue: i.from })),
      ];
    }
    result = await this.service.sanitize(result);

    return result;
  }

  async getInterface(req) {
    const loc = req.loc ?? defaultLoc;
    const gridActions = [];
    if (req.permissions.includes('issue.create')) gridActions.push('create');
    if (req.permissions.includes('issue.edit'))   gridActions.push('enableDisable', 'edit');
    if (req.permissions.includes('issue.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
    if (req.permissions.includes('issue.edit')) gridActions.push({
      name: 'take',
      type: 'buttonIcon',
      icon: 'assign-self',
      title: await loc._c('issue', 'Take issue'),
      actionData: {
        action: 'apiCall',
        service: 'issue/take',
        method: 'PATCH',
        bodyParam: { uuid: 'uuid' },
      },
    });

    const fields = [
      {
        name:        'title',
        type:        'text',
        label:       await loc._c('issue', 'Title'),
        placeholder: await loc._c('issue', 'Type the title here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        onValueChanged: {
          mode: {
            create:       true,
            defaultValue: false,
          },
          action:   'setValues',
          override: false,
          map: {
            name: {
              source:   'title',
              sanitize: 'dasherize',
            },
          },
        },
      },
      {
        name:       'name',
        type:       'text',
        label:       await loc._c('issue', 'Name'),
        placeholder: await loc._c('issue', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'project.uuid',
        gridName:    'project.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('issue', 'Project'),
        placeholder: await loc._c('issue', 'Select the project'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'issue/project',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'type.uuid',
        gridName:    'type.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('issue', 'Type'),
        placeholder: await loc._c('issue', 'Select the type'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'issue/type',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'priority.uuid',
        gridName:    'priority.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('issue', 'Priority'),
        placeholder: await loc._c('issue', 'Select the priority'),
        isField:     true,
        isColumn:    true,
        options: [{ value: null, text: '' }],
        loadOptionsFrom: {
          service: 'issue/priority',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       await loc._c('issue', 'Description'),
        placeholder: await loc._c('issue', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       await loc._c('issue', 'Enabled'),
        placeholder: await loc._c('issue', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:     'dueDate',
        type:     'dateTime',
        isField:  true,
        isColumn: true,
        label:    await loc._c('issue', 'Due date'),
      },
      {
        name:        'closeReason.uuid',
        gridName:    'closeReason.title',
        type:        'select',
        label:       await loc._c('issue', 'Close reason'),
        placeholder: await loc._c('issue', 'Type the description here'),
        isField:     true,
        isDetail:    true,
        options: [{ value: null, text: '' }],
        loadOptionsFrom: {
          service: 'issue/close-reason',
          value: 'uuid',
          text: 'title',
          title: 'description',
        },
      },
      {
        name:        'related',
        type:        'list',
        label:       await loc._c('issue', 'Related issues'),
        isField:     false,
        isDetail:    true,
        properties: [
          {
            label: await loc._c('issue', 'Relationship'),
            name: 'relationship.title',
          },
          {
            label: await loc._c('issue', 'Issue'),
            name: 'issue.title',
          },
        ],
      },
    ];

    const result = {
      title: await loc._c('issue', 'Issues'),
      load: {
        service: 'issue',
        method: 'get',
      },
      action: 'issue',
      gridActions,
      fields,
      fieldsFilter: conf?.issue,
    };

    return result;
  }

  deleteForUuidPermission =      'issue.delete';
  postEnableForUuidPermission =  'issue.edit';
  postDisableForUuidPermission = 'issue.edit';
  patchForUuidPermission =       'issue.edit';
  patchMiddleware = upload;

  async patch (req, res) {
    const newBody = {};
    for (const field in req.body) {
      if (field !== 'body' && !field.includes('.')) {
        let isObject = false;
        for (const otherField in req.body) {
          if (otherField === field) continue;
          const dotIndex = otherField.indexOf('.');
          if (dotIndex === -1) continue;
          if (otherField.substring(0, dotIndex) === field) {
            isObject = true;
            break;
          }
        }
        newBody[field] = isObject ? JSON.parse(req.body[field]) : req.body[field];
      }
    }
    req.body = newBody;
    req.body.files = req.files

    const { uuid } = await this.checkUuid(makeContext(req, res));
    const { uuid: _, ...data } = { ...req.body };
    const where = { uuid };

    await this.service.updateFor(data, where, { context: makeContext(req, res) });
  }

  'getPermission /project' = 'issue.edit';
  async 'get /project'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    const context = makeContext(req, res);
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.projectId) {
      options.where ??= {};
      options.where.id = await conf.filters.projectId(context) ?? null;
    }

    const result = await this.projectService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /type' = 'issue.edit';
  async 'get /type'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.issueTypeService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /priority' = 'issue.edit';
  async 'get /priority'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.issuePriorityService.getListAndCount(options);
    result = this.issuePriorityService.sanitize(result);

    return result;
  }

  'getPermission /close-reason' = 'issue.edit';
  async 'get /close-reason'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.issueCloseReasonService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /workflow' = 'issue.edit';
  async 'get /workflow'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.wfWorkflowOfEntityService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /status' = 'issue.edit';
  async 'get /status'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.wfStatusService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /assignee' = 'issue.edit';
  async 'get /assignee'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.userService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /transition' = 'issue.edit';
  async 'get /transition'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.wfTransitionService.getListAndCount(options);

    res.status(200).send(result);
  }

  'patchPermission /take' = 'issue.edit';
  async 'patch /take'(req, res) {
    const context = makeContext(req, res);
    const { uuid } = await this.checkUuid(context);
    const userId = await this.userService.getIdForUuid(req.user.uuid);
    await this.service.updateForUuid({ assigneeId: userId }, uuid);
    const caseIds = await this.wfCaseService.getIdFor({ entityUuid: uuid });
    await this.wfBranchService.updateFor({ assigneeId: userId }, { caseId: caseIds });
  }
}