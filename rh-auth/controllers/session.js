import { SessionService, SessionClosedError, NoSessionForAuthTokenError } from '../services/session.js';
import { getOptionsFromParamsAndOData } from 'http-util';
import { getErrorMessage, checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';
import { dependency } from 'rf-dependency';

export class SessionController extends Controller {
  static init() {
    this.log = dependency.get('log', {
      info: () => {},
    });
  }

  static configureMiddleware() {
    return async (req, res, next) => {
      const authorization = req.header('Authorization');
      if (!authorization) {
        next();
        return;
      }

      if (authorization.length < 8 || authorization.slice(0, 7).toLowerCase() !== 'bearer ') {
        this.log.info('invalid authorization token scheme');
        next();
        return;
      }

      req.authToken = authorization.substring(7).trim();
      if (!req.authToken) {
        next();
        return;
      }

      const loc = req.loc ?? defaultLoc;
      SessionService.singleton().getJSONForAuthTokenCached(req.authToken)
        .then(session => {
          req.session = session;
          req.user = req.session.user;
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

          this.log.info({ error: err, result });
          res.status(401).send(result);
        });
    };
  }

  constructor() {
    super();

    this.service = dependency.get('sessionService');
  }

  getPermission = ['ownSession.get', 'session.get'];
  async getData(req) {
    const definitions = { uuid: 'uuid', open: 'date', close: 'date', authToken: 'string', index: 'int' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    try {
      await req.checkPermission('session.get');
    // eslint-disable-next-line no-unused-vars
    } catch(e) {
      options.where = { ...options?.where, id: req.session.id };
    }

    const loc = req.loc ?? defaultLoc;
    const strftime = loc.strftime?
      (f, v) => loc.strftime(f, v):
      (f, v) => v;
    const data = await this.service.getListAndCount(options);
    data.rows = await Promise.all(data.rows.map(async row => {
      row.open = await strftime('%x %X', row.open);
      if (row.close) {
        row.close = await strftime('%x %X', row.close);
      }

      return row;
    }));

    return data;
  }

  async getGrid(req) {
    checkParameter(req.query, '$grid');

    const actions = [];
    if (req.permissions.includes('session.delete')) actions.push('delete');

    actions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;

    const grid = {
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
    };

    return grid;
  }

  deleteForUuidPermission = 'session.delete';
}