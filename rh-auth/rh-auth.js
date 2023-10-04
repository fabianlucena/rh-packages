'use strict';

import {UserService} from './services/user.js';
import {UserTypeService} from './services/user_type.js';
import {IdentityService} from './services/identity.js';
import {IdentityTypeService} from './services/identity_type.js';
import {conf as localConf} from './conf.js';
import './services/device.js';
import {SessionService} from './services/session.js';
import {SessionController} from './controllers/session.js';
import {loc} from 'rf-locale';
import {UnauthorizedError, NoPermissionError} from 'http-util';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

function configure (global) {
    if (global.router) {
        global.router.use(SessionController.configureMiddleware());
    }

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);

    global.eventBus?.$on('sessionUpdated', sessionUpdated);
}

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (!req.authToken) {
            const authorization = req.header('Authorization');
            if (!authorization) {
                throw new UnauthorizedError(loc._cf('auth', 'HTTP error 401 unauthorized, no authorization header.'));
            }
            
            if (!authorization.startsWith('Bearer ')) {
                throw new UnauthorizedError(loc._cf('auth', 'HTTP error 401 unauthorized, authorization schema is no Bearer.'));
            }
        }

        if (await chain(req, ...requiredPermissions)) {
            return;
        }

        throw new NoPermissionError({permissions: requiredPermissions});
    };
}

async function updateData(global) {
    const data = global?.data;
    if (!data) {
        return;
    }

    const userTypeService = UserTypeService.singleton();
    const identityTypeService = IdentityTypeService.singleton();
    const userService = UserService.singleton();
    const identityService = IdentityService.singleton();

    await runSequentially(data?.userTypes,     async data => await userTypeService.    createIfNotExists(data));
    await runSequentially(data?.identityTypes, async data => await identityTypeService.createIfNotExists(data));
    await runSequentially(data?.users,         async data => await userService.        createIfNotExists(data));
    await runSequentially(data?.identities,    async data => await identityService.    createIfNotExists(data));
}

async function sessionUpdated(sessionId) {
    SessionService.singleton().deleteFromCacheForSessionId(sessionId);
}
