import { SessionDataService } from './services/session-data.js';
import { conf as localConf } from './conf.js';
import { deepComplete } from 'rf-util';

export const conf = localConf;

conf.configure = configure;

function configure (global) {
  global.eventBus?.$on('login', login);
  global.eventBus?.$on('menuGet', menuGet);
}

async function login({ options }) {
  if (!options?.sessionId || !options?.oldSessionId) {
    return;
  }

  const sessionDataService = SessionDataService.singleton();
  const oldData = await sessionDataService.getDataOrNullForSessionId(options.oldSessionId);
  if (!oldData) {
    return;
  }

  const sessionId = options.sessionId;
  await sessionDataService.addData(sessionId, oldData);

  return sessionDataService.getDataOrNullForSessionId(sessionId);
}

async function menuGet({ data, options }) {
  if (!options?.sessionId) {
    return;
  }

  const thisData = await SessionDataService.singleton().getDataOrNullForSessionId(options.sessionId);
  deepComplete(data, thisData);

  return thisData;
}
