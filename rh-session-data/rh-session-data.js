import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';
import { deepComplete } from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];

function configure (global) {
  global.eventBus?.$on('login', login);
  global.eventBus?.$on('menuGet', menuGet);
}

var sessionDataService;
async function init() {
  sessionDataService = dependency.get('sessionDataService');
}

async function login({ sessionId, oldSessionId }) {
  if (!sessionId || !oldSessionId) {
    return;
  }

  if (oldSessionId) {
    const oldData = await sessionDataService.getDataOrNullForSessionId(oldSessionId);
    if (!oldData) {
      return;
    }

    await sessionDataService.addData(sessionId, oldData);
  }

  return sessionDataService.getDataOrNullForSessionId(sessionId);
}

async function menuGet({ data, sessionId }) {
  if (!sessionId) {
    return;
  }

  const thisData = await sessionDataService.getDataOrNullForSessionId(sessionId);
  deepComplete(data, thisData);

  return thisData;
}
