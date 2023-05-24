import {conf} from '../conf.js';
import {checkViewOptions, getSingle} from 'sql-util';
import {complete, deepComplete, check} from 'rf-util';
import {loc} from 'rf-locale';
import crypto from 'crypto';

export class SessionClosedError extends Error {
    statusCode = 403;
}

export class NoSessionForAuthTokenError extends Error {
    statusCode = 403;
}

complete(
    conf,
    {
        sessionCache: {},
        sessionCacheValidityTime: 60000,
        sessionCacheMaxLength: 10000,
        sessionCacheMaintenanceInterval: 1000,
        sessionCacheMaintenanceMethod: () => {
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
        },
    }
);

conf.init.push(() => conf.sessionCacheMaintenance = setInterval(conf.sessionCacheMaintenanceMethod, conf.sessionCacheMaintenanceInterval));

export class SessionService {
    /**
     * Creates a new session row into DB.
     * @param {{
     *  authToken: string,
     *  index: string,
     *  open: DateTime,
     *  close: DateTime,
     *  userId: integer,
     *  deviceId: integer,
     * }} data - data of the new session. Close property could be null.
     * @returns {Promise{Device}}
     */
    static create(data) {
        if (!data.authToken)
            data.authToken = crypto.randomBytes(64).toString('hex');

        if (!data.autoLoginToken)
            data.autoLoginToken = crypto.randomBytes(64).toString('hex');
        
        return conf.global.models.Session.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (!options)
            options = {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'index', 'open', 'close'];
            
            if (!options.include) {
                options.include = [
                    {
                        model: conf.global.models.User,
                        attributes: ['uuid', 'username', 'displayName']
                    },
                    {
                        model: conf.global.models.Device,
                        attributes: ['uuid', 'data']
                    }
                ];
            }
        }

        options = await checkViewOptions(options);

        return options;
    }

    /**
     * Gets a list of sessions.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{SessionList}]
     */
    static async getList(options) {
        return conf.global.models.Session.findAll(await SessionService.getListOptions(options));
    }

    /**
     * Gets a list of sessions and its rows count.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{SessionList}]
     */
    static async getListAndCount(options) {
        return conf.global.models.Session.findAndCountAll(await SessionService.getListOptions(options));
    }

    /**
     * Gets a session for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    static getForId(id, options) {
        return SessionService.getList(deepComplete(options, {where: {id}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['session', ['id = %s', id], 'Session']})));
    }

    /**
     * Gets a session for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    static getForUuid(uuid, options) {
        return SessionService.getList(deepComplete(options, {where: {uuid}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['session', ['UUID = %s', uuid], 'Session']})));
    }

    /**
     * Gets a session for its authToken. For many coincidences and for no rows this method fails.
     * @param {string} authToken - Auth token for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    static getForAuthToken(authToken, options) {
        return SessionService.getList(deepComplete(options, {where: {authToken}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['session', ['authToken = %s', authToken], 'Session']})));
    }

    /**
     * Get a session for a given authToken from the cache or from the DB. @see getForAuthToken method.
     * @param {string} authToken - value for the authToken to get the session.
     * @returns {Promise{Device}}
     */
    static getForAuthTokenCached(authToken) {
        if (conf.sessionCache && conf.sessionCache[authToken]) {
            const sessionData = conf.sessionCache[authToken];
            sessionData.lastUse = Date.now();
            return new Promise(resolve => resolve(sessionData.session));
        }

        return SessionService.getForAuthToken(authToken, {skipNoRowsError: true, include: [{model: conf.global.models.User}]})
            .then(session => new Promise((resolve, reject) => {
                if (!session)
                    return reject(new NoSessionForAuthTokenError());
                    
                if (session.close)
                    return reject(new SessionClosedError());

                conf.sessionCache[authToken] = {
                    session: session,
                    lastUse: Date.now(),
                };

                resolve(session);
            }));
    }

    /**
     * Closes a session for a given ID.
     * @param {number} id - ID for the session o close.
     * @returns {Promise{Session}}
     */
    static async closeForId(id) {
        check(id, {_message: loc._f('There is no id for session')});

        return SessionService.getForId(id)
            .then(session => {
                const authToken = session.authToken;
                if (conf.sessionCache[authToken])
                    delete conf.sessionCache[authToken];

                return conf.global.models.Session.update(
                    {close: Date.now()},
                    {where: {id}}
                );
            });
    }

    /**
     * Deletes a session for a given UUID.
     * @param {string} uuid - UUID for the session o delete.
     * @returns {Promise{Result}}
     */
    static async deleteForUuid(uuid) {
        const session = await SessionService.getForUuid(uuid, {_noRowsError: loc._f('Row for UUID %s does not exist', uuid)});
        if (session) {
            if (conf.sessionCache[session.authToken])
                delete conf.sessionCache[session.authToken];

            return conf.global.models.Session.destroy({where:{uuid}});
        }
    }

    /**
     * Gets a session for its autoLoginToken. For many coincidences and for no rows this method fails.
     * @param {string} autoLoginToken - auto login token for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    static getForAutoLoginToken(autoLoginToken, options) {
        return SessionService.getList(deepComplete(options, {where: {autoLoginToken}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['session', ['autoLoginToken = %s', autoLoginToken], 'Session']})));
    }
}