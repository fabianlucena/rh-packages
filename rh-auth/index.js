import {conf as localConf} from './conf.js';
import './services/device.js';
import './services/session.js';
import {SessionController} from './controllers/session.js';
import {UnauthorizedError, NoPermissionError} from 'http-util';
import {l} from 'rf-util';

export const conf = localConf;

conf.configure = function (global) {
    if (global.router)
        global.router.use(SessionController.configureMiddleware());

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);
};

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (!req.authToken) {
            const authorization = req.header('Authorization');
            if (!authorization) 
                throw new UnauthorizedError(l._f('HTTP error 401 unauthorized, no authorization header.'));
            
            if (!authorization.startsWith('Bearer '))
                throw new UnauthorizedError(l._f('HTTP error 401 unauthorized, authorization schema is no Bearer.'));
        }

        if (await chain(req, ...requiredPermissions))
            return;

        throw new NoPermissionError({permissions: requiredPermissions});
    };
}
