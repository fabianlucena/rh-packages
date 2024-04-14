import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { checkParameter, MissingParameterError } from 'rf-util';

const projectService = conf.global.services.Project.singleton();

export class ProjectSelectController {
  static async post(req, res) {
    const loc = req.loc;

    const projectUuid = req.query?.projectUuid ?? req.params?.projectUuid ?? req.body?.projectUuid;
    if (!projectUuid) {
      throw new MissingParameterError(loc._cf('projectSelect', 'Project UUID'));
    }

    const options = { skipNoRowsError: true };
    let project = await projectService.getForUuid(projectUuid, options);
    if (!project) {
      throw new _HttpError(loc._cf('projectSelect', 'The selected project does not exist or you do not have permission to access it.'), 400);
    }

    if (!project.isEnabled) {
      throw new _HttpError(loc._cf('projectSelect', 'The selected project is disabled.'), 403);
    }

    const sessionDataService = conf.global.services.SessionData.singleton();
    if (!sessionDataService) {
      throw new _HttpError(loc._cf('projectSelect', 'You do not have permission to select this project.'), 400);
    }

    const sessionId = req.session.id;

    if (!req.roles.includes('admin')) {
      let companyId;
      if (conf.filters?.getCurrentCompanyId) {
        companyId = await conf.filters.getCurrentCompanyId(req);
      }

      if (companyId != project.companyId) {
        throw new _HttpError(loc._cf('projectSelect', 'You do not have permission to select this project.'), 400);
      }
    }

    if (project.isTranslatable) {
      project.title = await loc._(project.title);
      project.description = await loc._(project.description);
    }

    delete project.isTranslatable;

    const menuItem = {
      name: 'project-select',
      parent: 'breadcrumb',
      action: 'object',
      service: 'project-select',
      label: await loc._('Project: %s', project.title),
      icon: 'project',
    };
    const data = {
      count: 1,
      rows: project,
      api: {
        data: {
          projectUuid: project.uuid,
        },
      },
      menu: [menuItem],
    };

    const sessionData = await sessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

    sessionData.api ??= {};
    sessionData.api.data ??= {};
    sessionData.api.data.projectUuid = project.uuid;

    sessionData.menu ??= [];
    sessionData.menu = sessionData.menu.filter(item => item.name != 'project-select');
    sessionData.menu.push(menuItem);

    await sessionDataService.setData(sessionId, sessionData);

    await conf.global.eventBus?.$emit('projectSwitch', data, { sessionId });
    await conf.global.eventBus?.$emit('sessionUpdated', sessionId);

    req.log?.info(`Project switched to: ${project.title}.`, { sessionId, projectName: project.name });

    res.status(200).send(data);
  }

  static async get(req, res) {
    if ('$object' in req.query) {
      return ProjectSelectController.getObject(req, res);
    }

    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData(req?.query, definitions, options);

    const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
    if (companyUuid) {
      options.where ??= {};
      options.where.companyUuid = companyUuid;
    }
        
    if (conf.filters?.getCurrentCompanyId) {
      options.where ??= {};
      options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
    }

    options.includeCompany = true;

    const result = await projectService.getListAndCount(options);
        
    res.status(200).send(result);
  }

  static async getObject(req, res) {
    checkParameter(req.query, '$object');

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

    let loc = req.loc;

    res.status(200).send({
      title: await loc._('Select project'),
      load: {
        service: 'project-select',
        method: 'get',
        queryParams: {
          companyUuid: 'companyUuid',
        },
      },
      actions: actions,
      properties: [
        {
          name: 'title',
          type: 'text',
          label: await loc._('Title'),
        },
        {
          name: 'name',
          type: 'text',
          label: await loc._('Name'),
        },
        {
          name: 'description',
          type: 'text',
          label: await loc._('Description'),
        },
      ]
    });
  }
}
