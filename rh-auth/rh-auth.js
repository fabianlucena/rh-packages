import { conf as localConf } from './conf.js';
import './services/device.js';
import { SessionController } from './controllers/session.js';
import { UnauthorizedError, NoPermissionError } from 'http-util';
import { runSequentially } from 'rf-util';
import { loc } from 'rf-locale';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.configure = configure;
conf.init = init;
conf.updateData = updateData;

function configure (global) {
  if (global.router) {
    global.router.use(SessionController.configureMiddleware());
  }

  const previousHandler = global.checkPermissionHandler;
  global.checkPermissionHandler = getCheckPermissionHandler(previousHandler);

  global.eventBus?.$on('sessionUpdated', sessionUpdated);
}

function init() {
  conf.sessionService = dependency.get('sessionService');
}

function getCheckPermissionHandler(chain) {
  return async (req, ...requiredPermissions) => {
    if (!req.authToken) {
      const authorization = req.header('Authorization');
      if (!authorization) {
        throw new UnauthorizedError(
          loc => loc._c('auth', 'HTTP error 401 unauthorized, no authorization header.'),
          {
            title: loc => loc._c('auth', 'Unauthorized error'),
            redirectTo: '#login',
          }
        );
      }
            
      if (!authorization.startsWith('Bearer ')) {
        throw new UnauthorizedError(
          loc._c('auth', 'HTTP error 401 unauthorized, authorization schema is no Bearer.'),
          {
            title: loc => loc._c('auth', 'Unauthorized error'),
            redirectTo: '#login',
          }
        );
      }
    }

    if (!requiredPermissions.length) {
      return;
    }

    if (await chain(req, ...requiredPermissions)) {
      return;
    }

    for (let permission of requiredPermissions) {
      if (permission === true) {
        return;
      }
    }

    throw new NoPermissionError({ permissions: requiredPermissions });
  };
}

async function updateData(global) {
  const data = global?.data;
  if (!data) {
    return;
  }

  const
    userTypeService =     dependency.get('userTypeService'),
    identityTypeService = dependency.get('identityTypeService'),
    userService =         dependency.get('userService'),
    identityService =     dependency.get('identityService');

  await runSequentially(data?.userTypes,     async data => await userTypeService.    createIfNotExists(data));
  await runSequentially(data?.identityTypes, async data => await identityTypeService.createIfNotExists(data));
  await runSequentially(data?.users,         async data => await userService.        createIfNotExists(data));
  await runSequentially(data?.identities,    async data => await identityService.    createIfNotExists(data));
}

async function sessionUpdated({ sessionId }) {
  conf.sessionService.deleteFromCacheForSessionId(sessionId);
}
