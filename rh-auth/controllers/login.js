import { conf } from '../conf.js';
import { HttpError, makeContext } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';
import { dependency } from 'rf-dependency';

export class LoginController extends Controller {
  constructor() {
    super();

    this.service = dependency.get('loginService');
  }

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
    let data;
    if (req?.body?.autoLoginToken) {
      data = checkParameter(req?.body, 'autoLoginToken', 'deviceToken');
    } else {
      data = checkParameter(
        req?.body,
        {
          username: loc => loc._c('login', 'Username'),
          password: loc => loc._c('login', 'Password'),
        },
      );
    }

    try {
      let session;
      if (data.autoLoginToken) {
        session = await this.service.forAutoLoginTokenAndSessionIndex(
          data.autoLoginToken,
          data.deviceToken,
          req.body?.sessionIndex ?? req.body.index,
          req.loc,
        );
        req.log?.info('Auto logged by autoLoginToken.', { autoLoginToken: data.autoLoginToken, session });
      } else {
        let deviceToken = data.deviceToken;
        const deviceService = dependency.get('deviceService', null);
        if (deviceService) {
          const device = await deviceService.getForTokenOrCreateNew(deviceToken);
          if (device) {
            deviceToken = device.token;
          }
        }

        session = await this.service.forUsernamePasswordDeviceTokenAndSessionIndex(
          req.body.username,
          req.body.password,
          deviceToken,
          req.body.sessionIndex ?? req.body.index,
          req.loc
        );
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
        {
          result,
          context: makeContext(req, res),
          sessionId: session.id,
          oldSessionId: session.oldSessionId,
          autoLogin: !!req?.body?.autoLoginToken,
        },
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

      throw new HttpError(loc => loc._c('login', 'Invalid login'), 403);
    }
  }

  async ['get /check'](req, res) {
    const session = req.session;
    if (!session?.id) {
      res.status(401).send({ error: 'invalid credentials' });
      return;
    }

    const result = {};
    await conf.global.eventBus?.$emit(
      'login',
      {
        result,
        context: makeContext(req, res),
        sessionId: session.id,
        checkLogin: true,
      },
    );

    res.status(200).send(result);
  }
}
