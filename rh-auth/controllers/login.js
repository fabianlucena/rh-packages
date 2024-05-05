import { LoginService } from '../services/login.js';
import { conf } from '../conf.js';
import { _HttpError } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';
import { dependency } from 'rf-dependency';

export class LoginController extends Controller {
  async getForm(req) {
    let loc = req.loc ?? defaultLoc;

    return {
      title: await loc._c('login', 'Login'),
      className: 'small one-per-line',
      action: 'login',
      method: 'post',
      onSuccess: {
        setBearerAuthorizationFromResponseProperty: 'authToken',
        reloadMenu: true,
      },
      includeSessionIndexInBody: true,
      skipConfirmation: true,
      fields: [
        {
          name: 'username',
          type: 'text',
          label: await loc._c('login', 'Username'),
          placeholder: await loc._c('login', 'Type the username here'),
        },
        {
          name: 'password',
          type: 'password',
          label: await loc._c('login', 'Password'),
          placeholder: await loc._c('login', 'Type the password here'),
        }
      ]
    };
  }

  async post(req, res) {
    const loc = req.loc ?? defaultLoc;
    if (req?.body?.autoLoginToken) {
      checkParameter(req?.body, 'autoLoginToken', 'deviceToken');
    } else {
      checkParameter(req?.body, { username: loc._cf('login', 'Username'), password: loc._cf('login', 'Password') });
    }

    try {
      const loginService = LoginService.singleton();
      let session;
      if (req.body.autoLoginToken) {
        session = await loginService.forAutoLoginTokenAndSessionIndex(req.body.autoLoginToken, req.body.deviceToken, req.body?.sessionIndex ?? req.body.index, loc);
        req.log?.info('Auto logged by autoLoginToken.', { autoLoginToken: req.body.autoLoginToken, session });
      } else {
        let deviceToken = req.body.deviceToken;
        const deviceService = dependency.get('deviceService');
        if (deviceService) {
          if (deviceToken) {
            const device = await deviceService.getForTokenOrNull(deviceToken);
            if (!device) {
              deviceToken = null;
            }
          }

          if (!deviceToken) {
            const device = await deviceService.create({ data: '' });
            deviceToken = device.token;
          }
        }

        session = await loginService.forUsernamePasswordDeviceTokenAndSessionIndex(req.body.username, req.body.password, deviceToken, req.body.sessionIndex ?? req.body.index, loc);
        req.log?.info(`User ${req.body.username} successfully logged with username and password.`, { session });
      }
            
      const result = {
        index: session.index,
        authToken: session.authToken,
        deviceToken: session.deviceToken,
        autoLoginToken: session.autoLoginToken,
      };

      await conf.global.eventBus?.$emit(
        'login',
        result,
        {
          sessionId: session.id,
          oldSessionId: session.oldSessionId,
          autoLogin: !!req.body.autoLoginToken
        }
      );

      req.session = session;
      res.header('Authorization', 'Bearer ' + session.authToken);
      res.status(201).send(result);
    } catch (error) {
      if (req.body.autoLoginToken) {
        req.log?.info(`Error trying logged by autoLoginToken: ${error}.`, { autoLoginToken: req.body.autoLoginToken, error });
      } else {
        req.log?.info(`Error in login: ${error}.`, { username: req.body.username, error });
      }

      throw new _HttpError(loc._cf('login', 'Invalid login'), 403);
    }
  }

  async ['get /check'](req, res) {
    if (req.session?.id) {
      res.status(204).send();
    } else {
      res.status(401).send({ error: 'invalid credentials' });
    }
  }
}
