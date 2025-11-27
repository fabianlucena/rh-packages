import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { getSingle } from 'sql-util';
import { BaseError, check, } from 'rf-util';
import crypto from 'crypto';

export class SessionClosedError extends BaseError {
  statusCode = 403;
}

export class NoSessionForAuthTokenError extends BaseError {
  statusCode = 403;
}

conf.sessionCache ??= {};
conf.sessionCacheValidityTime ??= 60000;
conf.sessionCacheMaxLength ??= 10000;
conf.sessionCacheMaintenanceInterval ??= 1000;
conf.sessionCacheMaintenanceMethod ??= () => {
  const expiration = new Date(Date.now() - conf.sessionCacheValidityTime);
  const list = [];
  for (const authToken in conf.sessionCache) {
    const item = conf.sessionCache[authToken];
    if (item.lastUse < expiration) {
      delete conf.sessionCache[authToken];
    } else {
      list.push({
        authToken,
        lastUse: conf.sessionCache[authToken].lastUse,
      });
    }
  }

  list.sort((a, b) => a.lastUse - b.lastUse);
  list.slice(conf.sessionCacheMaxLength).forEach(item => delete conf.sessionCache[item.authToken]);
};

conf.init.push(() => conf.sessionCacheMaintenance = setInterval(conf.sessionCacheMaintenanceMethod, conf.sessionCacheMaintenanceInterval));

export class SessionService extends Service.IdUuid {
  references = {
    user: {
      attributes: ['uuid', 'username', 'displayName'],
    },
    device: {
      attributes: ['uuid', 'data'],
    }
  };

  async validateForCreation(data) {
    if (!data.authToken) {
      data.authToken = crypto.randomBytes(64).toString('base64')
        .replaceAll('=', '');
    }

    if (!data.autoLoginToken) {
      data.autoLoginToken = crypto.randomBytes(64).toString('base64')
        .replaceAll('=', '');
    }
        
    return super.validateForCreation(data);
  }

  /**
   * Gets the options for use in the getList and getListAndCount methods.
   * @param {object} options - options for the @see sequelize.findAll method.
   *  - view: show visible properties.
   * @returns {t}
   */
  async getListOptions(options) {
    if (!options) {
      options = {};
    }

    if (options.view) {
      if (!options.attributes) {
        options.attributes = ['uuid', 'index', 'open', 'close'];
      }
            
      if (!options.include) {
        options.include = {
          user: true,
          device: true,
        };
      }
    }

    return super.getListOptions(options);
  }

  /**
   * Gets a session for its authToken. For many coincidences and for no rows this method fails.
   * @param {string} authToken - Auth token for the session to get.
   * @param {object} options - Options for the @ref getList method.
   * @returns {Promise[Session]}
   */
  async getForAuthToken(authToken, options) {
    if (!authToken) { 
        return null;
    }
    const rows = await this.getList({ ...options, where: { ...options?.where, authToken }, limit: 2 });
    return getSingle(rows, { ...options, params: ['session', ['authToken = %s', authToken], 'Session'] });
  }

  /**
   * Get a session for a given authToken from the cache or from the DB. @see getForAuthToken method.
   * @param {string} authToken - value for the authToken to get the session.
   * @returns {Promise[Device]}
   */
  async getJSONForAuthTokenCached(authToken) {
    if (conf.sessionCache && conf.sessionCache[authToken]) {
      const sessionData = conf.sessionCache[authToken];
      sessionData.lastUse = Date.now();

      return sessionData.session;
    }

    let session = await this.getForAuthToken(
      authToken,
      {
        skipNoRowsError: true,
        include: { user: { attributes: true }},
      },
    );
    if (!session) {
      throw new NoSessionForAuthTokenError();
    }
            
    if (session.close) {
      throw new SessionClosedError();
    }

    conf.sessionCache[authToken] = {
      session: session,
      lastUse: Date.now(),
    };

    return session;
  }

  async deleteFromCacheForSessionId(sessionId) {
    for (const authToken in conf.sessionCache) {
      if (conf.sessionCache[authToken].session.id === sessionId) {
        delete conf.sessionCache[authToken];
        break;
      }
    }
  }

  /**
   * Closes a session for a given ID.
   * @param {number} id - ID for the session o close.
   * @returns {Promise[Session]}
   */
  async closeForId(id) {
    check(id, { message: loc => loc._c('session', 'There is no id for session') });

    const session = await this.getSingleForId(id);
    const authToken = session.authToken;
    if (conf.sessionCache[authToken]) {
      delete conf.sessionCache[authToken];
    }

    return this.updateForId({ close: Date.now() }, id);
  }

  /**
   * Deletes a session for a given UUID.
   * @param {string} uuid - UUID for the session o delete.
   * @returns {Promise[integer]}
   */
  async deleteForUuid(uuid, options) {
    const session = await this.getSingleOrNullForUuid(uuid, options);
    if (!session) {
      return 0;
    }
    
    if (conf.sessionCache[session.authToken]) {
      delete conf.sessionCache[session.authToken];
    }

    return super.deleteForUuid(uuid);
  }

  /**
   * Gets a session for its autoLoginToken. For many coincidences and for no rows this method fails.
   * @param {string} autoLoginToken - auto login token for the session to get.
   * @param {object} options - Options for the @ref getList method.
   * @returns {Promise[Session]}
   */
  async getForAutoLoginToken(autoLoginToken, options) {
    const rows = await this.getList({ ...options, where: { ...options?.where, autoLoginToken }, limit: 2 });
    return getSingle(rows, { params: ['session', ['autoLoginToken = %s', autoLoginToken], 'Session'], ...options });
  }
}