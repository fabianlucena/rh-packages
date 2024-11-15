import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

async function configure(global, options) {
  if (options) {
    for (const k of ['queryParams', 'requestFilters', 'checkFunction']) {
      conf[k] = options[k];
    }
  }

  dependency.addStatic('getAvailableProjectsId', getAvailableProjectsId);
  dependency.addStatic('projectId',              projectId);
  dependency.addStatic('getCurrentProject',      getCurrentProject);
}

var projectService,
  eventBus,
  sessionDataService;
async function init() {
  eventBus =           dependency.get('eventBus', null);
  projectService =     dependency.get('projectService');
  sessionDataService = dependency.get('sessionDataService', null);
}

export async function getFiltersForContext(context) {
  if (!conf.requestFilters) {
    return;
  }

  const filters = conf.requestFilters;
  const req = context.req;
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
      value = await value(context);
    }

    where[name] = value;
  }

  return where;
}

export async function getAvailableProjectsId(context) {
  const options = {
    isEnabled: true,
    skipNoRowsError: true,
  };

  return projectService.getIdFor(await getFiltersForContext(context), options);
}

export async function projectId(context) {
  const sessionId = context?.req?.session?.id;
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
    
    const eventOptions = { entity: 'ProjectSelect', context, sessionId, data };
    await eventBus.$emit('getCurrentProject', eventOptions);
    if (data?.project?.id) {
      if (sessionData) {
        sessionData.project = data.project;
        await sessionDataService.setData(sessionId, sessionData);  
      }

      return data.project.id;
    }

    await eventBus.$emit('projectId', eventOptions);
    if (data?.projectId) {
      if (sessionData) {
        sessionData.projectId = data.projectId;
        await sessionDataService.setData(sessionId, sessionData);  
      }
      
      return data.projectId;
    }
  }
}

export async function getCurrentProject(context) {
  const projectId = await projectId(context);
  if (!projectId) {
    return;
  }

  return projectService.getSingleForId(projectId);
}