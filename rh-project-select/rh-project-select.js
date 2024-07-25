import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';
import { makeContext } from 'http-util';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

async function configure(global, options) {
  if (options) {
    for (const k of ['queryParams', 'requestFilters', 'checkFunction']) {
      conf[k] = options[k];
    }
  }

  dependency.addStatic('getAvailableProjectsIdForRequest', getAvailableProjectsIdForRequest);
  dependency.addStatic('getCurrentProjectId', getCurrentProjectId);
  dependency.addStatic('getCurrentProject',   getCurrentProject);
}

var projectService,
  eventBus,
  sessionDataService;
async function init() {
  eventBus =           dependency.get('eventBus', null);
  projectService =     dependency.get('projectService');
  sessionDataService = dependency.get('sessionDataService', null);
}

export async function getFiltersFromRequest(req) {
  if (!conf.requestFilters) {
    return;
  }

  const filters = conf.requestFilters;
  const request = {
    ...req?.query,
    ...req?.params,
    ...req?.body,
  };

  const where = {};
  for (var name in filters) {
    let value = filters[name];
    if (typeof value === 'object' &&
      value && 
      Object.keys(value).length === 1 &&
      value.request
    ) {
      value = request[value.request];
    } else if (typeof value === 'function') {
      value = await value(req);
    }

    where[name] = value;
  }

  return where;
}

async function getAvailableProjectsIdForRequest(req) {
  const options = {
    isEnabled: true,
    skipNoRowsError: true,
  };

  return projectService.getIdFor(await getFiltersFromRequest(req), options);
}

async function getCurrentProjectId(req, res) {
  const sessionId = req?.session?.id;
  if (!sessionId) {
    return;
  }

  const sessionData = await sessionDataService?.getDataOrNullForSessionId(sessionId);
  if (sessionData) {
    if (sessionData.project?.id) {
      return sessionData.project.id;
    }

    if (sessionData.projectId) {
      return sessionData?.projectId;
    }
  }

  if (eventBus) {
    const data = {};
    
    const context = makeContext(req, res),
      eventOptions = { entity: 'ProjectSelect', context, sessionId, data };

    await eventBus.$emit('getCurrentProject', eventOptions);
    if (data?.project?.id) {
      if (sessionData) {
        sessionData.project = data.project;
        await this.sessionDataService.setData(sessionId, sessionData);  
      }

      return data.project.id;
    }

    await eventBus.$emit('getCurrentProjectId', eventOptions);
    if (data?.projectId) {
      if (sessionData) {
        sessionData.projectId = data.projectId;
        await this.sessionDataService.setData(sessionId, sessionData);  
      }
      
      return data.projectId;
    }
  }
}

async function getCurrentProject(req) {
  const projectId = await getCurrentProjectId(req);
  if (!projectId) {
    return;
  }

  return this.projectService.getSingleForId(projectId);
}