import { dependency } from 'rf-dependency';
import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, HttpError, makeContext } from 'http-util';
import { checkParameter, MissingParameterError } from 'rf-util';
import { Controller } from 'rh-controller';
import { getFiltersFromRequest } from '../rh-project-select.js';

export class ProjectSelectController extends Controller {
  constructor() {
    super();
    this.eventBus = dependency.get('eventBus', null);
    this.projectService =     dependency.get('projectService');
    this.sessionDataService = dependency.get('sessionDataService', null);
  }

  postPermission = 'project-select.switch';
  async post(req, res) {
    const loc = req.loc;

    const projectUuid = req.query?.projectUuid ?? req.params?.projectUuid ?? req.body?.projectUuid;
    if (!projectUuid) {
      throw new MissingParameterError(loc => loc._c('projectSelect', 'Project UUID'));
    }

    const options = { skipNoRowsError: true, loc };
    let project = await this.projectService.getSingleOrNullForUuid(projectUuid, options);
    if (!project) {
      throw new HttpError(loc => loc._c('projectSelect', 'The selected project does not exist or you do not have permission to access it.'), 400);
    }

    if (!project.isEnabled) {
      throw new HttpError(loc => loc._c('projectSelect', 'The selected project is disabled.'), 403);
    }

    if (conf.checkFunction) {
      if (!conf.checkFunction(project, req)) {
        throw new HttpError(loc => loc._c('projectSelect', 'You do not have permission to select this project.'), 400);
      }
    }

    const menuItem = {
      name:    'project-select',
      parent:  'breadcrumb',
      action:  'object',
      service: 'project-select',
      label:   await loc._c('projectSelect', 'Project: %s', project.title),
      icon:    'project',
    };
    const data = {
      count: 1,
      rows: [await this.projectService.sanitizeRow(project)],
      api: {
        data: {
          projectUuid: project.uuid,
        },
      },
      menu: [menuItem],
    };

    const sessionId = req.session.id;
    if (this.sessionDataService) {
      const sessionData = await this.sessionDataService.getDataOrNullForSessionId(sessionId) ?? {};

      sessionData.project = project;
      sessionData.projectId = project.id;
      sessionData.api ??= {};
      sessionData.api.data ??= {};
      sessionData.api.data.projectUuid = project.uuid;

      sessionData.menu ??= [];
      sessionData.menu = sessionData.menu.filter(item => item.name != 'project-select');
      sessionData.menu.push(menuItem);

      await this.sessionDataService.setData(sessionId, sessionData);
    }

    if (this.eventBus) {
      const context = makeContext(req, res),
        eventOptions = { entity: 'ProjectSelect', context, sessionId };

      await this.eventBus.$emit('projectSwitch', { ...eventOptions, data });
      await this.eventBus.$emit('sessionUpdated', eventOptions);
    }

    req.log?.info(`Project switched to: ${project.title}.`, { sessionId, projectName: project.name });

    return data;
  }

  getPermission = 'project-select.switch';
  async getData(req) {
    const definitions = {
      uuid: 'uuid',
      name: 'string',
    };
    if (conf.queryParams) {
      Object.keys(conf.queryParams)
        .forEach(k => definitions[k] = 'string');
    }
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      where: await getFiltersFromRequest(req),
    };

    options = await getOptionsFromParamsAndOData(
      req?.query,
      definitions,
      options,
    );

    const result = await this.projectService.getListAndCount(options);

    return result;
  }

  async getObject(req) {
    checkParameter(req.query, '$object');

    const loc = req.loc;

    const actions = [
      {
        name: 'select',
        type: 'button',
        icon: 'get-into',
        actionData: {
          bodyParam: { projectUuid: 'uuid' },
          onSuccess: { reloadMenu: true },
        },
      },
    ];

    const properties = [
      {
        name: 'title',
        type: 'text',
        label: await loc._c('projectSelect', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._c('projectSelect', 'Name'),
      },
      {
        name: 'description',
        type: 'text',
        label: await loc._c('projectSelect', 'Description'),
      },
    ];

    let queryParams;
    if (conf.queryParams) {
      queryParams = conf.queryParams;
    }

    const object = {
      title: await loc._c('projectSelect', 'Select project'),
      load: {
        service: 'project-select',
        method: 'get',
        queryParams,
      },
      actions,
      properties,
    };

    return object;
  }
}
