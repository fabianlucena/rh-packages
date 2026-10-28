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
    const definitions = {
      uuid: 'uuid',
      open: 'date',
      close: 'date',
      authToken: 'string',
      index: 'int',
      status: 'string',
      user: 'string',
      role: 'string',
    };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    try {
      await req.checkPermission('session.get');
    } catch(e) {
      options.where = { ...options?.where, id: req.session.id };
    }


    options.orderBy = (options.orderBy && options.orderBy.length) ? options.orderBy : [['open', 'DESC']];
    options.order = options.orderBy;

   
    if (!options.attributes) {
      options.attributes = ['id', 'uuid', 'userId', 'index', 'open', 'close'];
    }

    const loc = req.loc ?? defaultLoc;
    const strftime = loc.strftime?
      (f, v) => loc.strftime(f, v):
      (f, v) => v;
    const data = await this.service.getListAndCount(options);

    const userIds = [...new Set(data.rows.map(r => r.userId || r.user?.id).filter(Boolean))];
    const userRolesMap = {};

    if (userIds.length) {
      try {
        const sequelize = this.service.model?.sequelize || dependency.get('userSiteRoleService')?.model?.sequelize;
        const UserSiteRole = sequelize?.models?.UserSiteRole;
        const Role = sequelize?.models?.Role;

        if (UserSiteRole && Role) {
          const siteService = dependency.get('siteService', null);
          const systemSite = siteService ? await siteService.getSingleForName('system', { skipNoRowsError: true }) : null;
          const siteIds = [req.site?.id, systemSite?.id].filter(Boolean);

          const whereClause = {
            userId: userIds,
            isEnabled: true,
          };
          if (siteIds.length) {
            whereClause.siteId = siteIds;
          }

          const userSiteRoles = await UserSiteRole.findAll({
            where: whereClause,
            include: [
              {
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'title', 'isTranslatable'],
                where: { isEnabled: true },
                required: true,
              },
            ],
          });

          for (const usr of userSiteRoles) {
            if (!userRolesMap[usr.userId]) {
              userRolesMap[usr.userId] = [];
            }
            const roleTitle = usr.role?.title || usr.role?.name;
            if (roleTitle && !userRolesMap[usr.userId].includes(roleTitle)) {
              userRolesMap[usr.userId].push(roleTitle);
            }
          }
        }
      } catch (err) {
        this.log.info({ message: 'Error retrieving user roles for sessions grid', error: err });
      }
    }

    const activeText = await loc._c('session', 'Activa');
    const closedText = await loc._c('session', 'Cerrada');
    const inProgressText = await loc._c('session', 'en curso');

    data.rows = await Promise.all(data.rows.map(async row => {
      const item = (typeof row.toJSON === 'function') ? row.toJSON() : { ...row };
      const openDate = item.open ? new Date(item.open) : null;
      const closeDate = item.close ? new Date(item.close) : null;
      const isActive = !closeDate;

      item.status = isActive ? `🟢 ${activeText}` : closedText;

      const displayName = item.user?.displayName || '';
      const username = item.user?.username ? `@${item.user.username}` : '';
      if (displayName && username) {
        item.user = `${displayName} (${username})`;
      } else if (displayName || username) {
        item.user = displayName || username;
      } else {
        item.user = '-';
      }

      const uid = item.userId || item.user?.id;
      const roles = uid && userRolesMap[uid] ? userRolesMap[uid] : [];
      if (roles.length > 0) {
        item.role = roles.join(', ');
      } else if (item.user?.username === 'admin' || username === '@admin') {
        item.role = 'Super Administrador (Global)';
      } else {
        item.role = 'Sin roles en este sitio';
      }

      if (openDate) {
        const startMs = openDate.getTime();
        const endMs = closeDate ? closeDate.getTime() : Date.now();
        const diffMs = Math.max(0, endMs - startMs);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let durationStr = '';
        if (diffDays > 0) {
          durationStr = `${diffDays}d ${diffHours % 24}h`;
        } else if (diffHours > 0) {
          durationStr = `${diffHours}h ${diffMins % 60}m`;
        } else {
          durationStr = `${diffMins} min`;
        }

        item.duration = isActive ? `${durationStr} (${inProgressText})` : durationStr;
      } else {
        item.duration = '-';
      }

      // 5. Formateo de fechas
      if (item.open) {
        item.open = await strftime('%x %X', item.open);
      }
      if (item.close) {
        item.close = await strftime('%x %X', item.close);
      } else {
        item.close = '-';
      }

      return item;
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
      orderBy: [{ name: 'open', direction: 'desc' }],
      actions: actions,
      columns: [
        {
          name: 'status',
          type: 'text',
          label: await loc._c('session', 'Estado'),
        },
        {
          name: 'user',
          type: 'text',
          label: await loc._c('session', 'Usuario'),
        },
        {
          name: 'role',
          type: 'text',
          label: await loc._c('session', 'Rol'),
        },
        {
          name: 'open',
          type: 'text',
          label: await loc._c('session', 'Abierto'),
        },
        {
          name: 'close',
          type: 'text',
          label: await loc._c('session', 'Cerrado'),
        },
        {
          name: 'duration',
          type: 'text',
          label: await loc._c('session', 'Duración'),
        },
      ]
    };

    return grid;
  }

  deleteForUuidPermission = 'session.delete';
}