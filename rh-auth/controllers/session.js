import { SessionService, SessionClosedError, NoSessionForAuthTokenError } from '../services/session.js';
import { getOptionsFromParamsAndOData, deleteHandler } from 'http-util';
import { getErrorMessage, checkParameter, checkParameterUuid } from 'rf-util';
import { defaultLoc } from 'rf-locale';

function hidePrivateData(data) {
  if (typeof data !== 'object') {
    return data;
  }

  const result = {};

  for (const k in data) {
    if (/password/.test(k)) {
      result[k] = '****';
    } else {
      result[k] = hidePrivateData(data[k]);
    }
  }

  return result;
}

export class SessionController {
  static configureMiddleware() {
    return async (req, res, next) => {
      let logLine = `${req.method} ${req.path}`;
      const logOptions = {};
      if (Object.keys(req.query).length) {
        logOptions.query = hidePrivateData(req.query);
      }

      if (Object.keys(req.body).length) {
        logOptions.body = hidePrivateData(req.body);
      }

      const authorization = req.header('Authorization');
      if (!authorization || authorization.length < 8 || !authorization.startsWith('Bearer ')) {
        req.log?.info(logLine, logOptions);
        next();
        return;
      }

      req.authToken = authorization.substring(7);
      if (!req.authToken) {
        req.log?.info(logLine, logOptions);
        next();
        return;
      }

      const loc = req.loc ?? defaultLoc;
      SessionService.singleton().getJSONForAuthTokenCached(req.authToken)
        .then(session => {
          req.session = session;
          req.user = req.session.User;
          req.log?.info(logLine, { ...logOptions, session: session.id, username: session.User.username });
          next();
        })
        .catch(async err => {
          let result;
          if (err instanceof SessionClosedError) {
            result = { message: await loc._c('session', 'HTTP error 401 unauthorized, session is closed.') };
          } else if (err instanceof NoSessionForAuthTokenError) {
            result = { message: await loc._c('session', 'HTTP error 401 unauthorized, authorization token error.') };
          } else {
            let msg;
            if (err instanceof Error) {
              msg = await getErrorMessage(err, loc);
            } else {
              msg = err;
            }

            if (msg) {
              result = { message: await loc._c('session', 'HTTP error 401 unauthorized: %s', msg) };
            } else {
              result = { message: await loc._c('session', 'HTTP error 401 unauthorized') };
            }
          }

          result.error ??= 'Unauthorized';
          result.title ??= await loc._c('Unauthorized');
          result.clearBearerAuthorization = true;
          result.redirectTo = '#login';

          req.log.error(logLine, { ...logOptions, error: err, result });
          res.status(401).send(result);
        });
    };
  }

  static async get(req, res) {
    if ('$grid' in req.query) {
      return SessionController.getGrid(req, res);
    } else if ('$form' in req.query) {
      return SessionController.getForm(req, res);
    }
            
    const definitions = { uuid: 'uuid', open: 'date', close: 'date', authToken: 'string', index: 'int' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    try {
      await req.checkPermission('session.get');
    } catch(_) {
      options.where = { ...options?.where, id: req.session.id };
    }

    const loc = req.loc ?? defaultLoc;
    const strftime = loc.strftime ?? ((f, v) => v);
    const data = await SessionService.singleton().getListAndCount(options);
    data.rows = await Promise.all(data.rows.map(async row => {
      row.open = await strftime('%x %X', row.open);
      if (row.close) {
        row.close = await strftime('%x %X', row.close);
      }

      return row;
    }));

    res.status(200).send(data);
  }

  static async getGrid(req, res) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('session.delete')) actions.push('delete');

    actions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;

    res.status(200).send({
      title: await loc._c('session', 'Sessions'),
      load: {
        service: 'session',
        method: 'get',
      },
      actions: actions,
      columns: [
        {
          name: 'open',
          type: 'text',
          label: await loc._c('session', 'Open'),
        },
        {
          name: 'close',
          type: 'text',
          label: await loc._c('session', 'Close'),
        },
      ]
    });
  }

  static async delete(req, res) {
    const loc = req.loc ?? defaultLoc;
    const uuid = checkParameterUuid(req?.query?.uuid, loc._cf('session', 'UUID'));
    const rowCount = await SessionService.singleton().deleteForUuid(uuid);
    await deleteHandler(req, res, rowCount);
  }
}