import { HttpError } from 'http-util';
import { Service } from 'rf-service';
import { conf } from '../conf.js';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class ProjectSelectService extends Service.Base {
  model = null;

  init() {
    super.init();

    this.projectService =     dependency.get('projectService');
    this.sessionDataService = dependency.get('sessionDataService', null);
  }

  async selectForUuid(projectUuid, { context }) {
    let project = await this.projectService.getSingleOrNullForUuid(projectUuid, { skipNoRowsError: true });
    if (!project) {
      throw new HttpError(loc => loc._c('projectSelect', 'The selected project does not exist or you do not have permission to access it.'), 400);
    }

    if (!project.isEnabled) {
      throw new HttpError(loc => loc._c('projectSelect', 'The selected project is disabled.'), 403);
    }

    if (conf.checkFunction) {
      if (!conf.checkFunction(project, context)) {
        throw new HttpError(loc => loc._c('projectSelect', 'You do not have permission to select this project.'), 400);
      }
    }

    const loc = context.loc ?? defaultLoc;
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

    const sessionId = context.sessionId;
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
      const eventOptions = { entity: 'ProjectSelect', context, sessionId };

      await this.eventBus.$emit('projectSwitch', { ...eventOptions, data });
      await this.eventBus.$emit('sessionUpdated', eventOptions);
    }

    context.log?.info(`Project switched to: ${project.title}.`, { sessionId, projectName: project.name });

    return data;
  }
}