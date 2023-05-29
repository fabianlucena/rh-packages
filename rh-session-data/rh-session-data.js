'use strict';

import {SessionDataService} from './services/session-data.js';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;

function configure (global) {
    global.eventBus?.$on('login', login);
    global.eventBus?.$on('menuGet', menuGet);
}

async function login(session) {
    if (!session?.id || !session?.oldSessionId)
        return;

    const oldData = await SessionDataService.getDataIfExistsForSessionId(session.oldSessionId);
    if (!oldData)
        return;

    return SessionDataService.addData(session.id, oldData);
}

async function menuGet(sessionId) {
    if (!sessionId)
        return;

    return SessionDataService.getDataIfExistsForSessionId(sessionId);
}
