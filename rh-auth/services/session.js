const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');
const crypto = require('crypto');
const l = ru.locale;

class IsClosedError extends Error {}

ru.complete(
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
                        authToken: authToken,
                        lastUse: conf.sessionCache[authToken].lastUse,
                    });
                }
            }

            list.sort((a, b) => a.lastUse - b.lastUse)
            list.slice(conf.sessionCacheMaxLength).forEach(item => delete conf.sessionCache[item.authToken]);
        },
    }
);

conf.init.push(() => conf.sessionCacheMaintenance = setInterval(conf.sessionCacheMaintenanceMethod, conf.sessionCacheMaintenanceInterval));

const SessionService = {

    IsClosedError: IsClosedError,

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
     create(data) {
        if (!data.authToken)
            data.authToken = crypto.randomBytes(64).toString("hex");
        
        return conf.global.models.Session.create(data);
    },

    /**
     * Gets a list of sessions.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{SessionList}]
     */
    getList(options) {
        if (!options)
            options = {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'index', 'open', 'close'];
            
            if (!options.include) {
                options.include = [
                    {
                        model: conf.global.models.User,
                        attributes: ['uuid','username','displayName']
                    },
                    {
                        model: conf.global.models.Device,
                        attributes: ['uuid','data']
                    }
                ];
            }
        }

        return sqlUtil.checkViewOptions(options)
            .then(options => conf.global.models.Session.findAll(options));
    },

    /**
     * Gets a session for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    getForId(id, options) {
        return SessionService.getList(ru.deepComplete(options, {where: {id: id}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['session', ['id = %s', id], 'Session']})));
    },

    /**
     * Gets a session for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    getForUUID(uuid, options) {
        return SessionService.getList(ru.deepComplete(options, {where: {uuid: uuid}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['session', ['UUID = %s', uuid], 'Session']})));
    },

    /**
     * Gets a session for its authToken. For many coincidences and for no rows this method fails.
     * @param {string} authToken - Auth yoken for the session to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Session}}
     */
    getForAuthToken(authToken, options) {
        return SessionService.getList(ru.deepComplete(options, {where: {authToken: authToken}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['session', ['authToken = %s', authToken], 'Session']})));
    },

    /**
     * Get a session for a given authToken from the cache or from the DB. @see getForCookie method.
     * @param {string} authToken - value for the authToken to get the session.
     * @returns {Promise{Device}}
     */
    getForAuthTokenCached(authToken) {
        if (conf.sessionCache && conf.sessionCache[authToken]) {
            const sessionData = conf.sessionCache[authToken];
            sessionData.lastUse = Date.now();
            return new Promise(resolve => resolve(sessionData.session));
        }

        return SessionService.getForAuthToken(authToken, {include: [{model: conf.global.models.User}]})
            .then(session => new Promise((resolve, reject) => {
                if (session.close)
                    return reject(new IsClosedError());

                conf.sessionCache[authToken] = {
                    session: session,
                    lastUse: Date.now(),
                }

                resolve(session);
            }));
    },

    /**
     * Closes a session for a given ID.
     * @param {number} id - ID for the session o close.
     * @returns {Promise{Session}}
     */
     closeForId(id) {
        return ru.check(id, {_message: l._f('There is no id for session')})
            .then(() => SessionService.getForId(id))
            .then(session => {
                const authToken = session.authToken;
                if (conf.sessionCache[authToken])
                    delete conf.sessionCache[authToken];

                return conf.global.models.Session.update({
                    close: Date.now(),
                }, {
                    where: {
                        id: id,
                    }
                })
            });
    },

    /**
     * Deletes a session for a given UUID.
     * @param {string} uuid - UUID for the session o delete.
     * @returns {Promise{Result}}
     */
    async deleteForUuid(uuid) {
        const session = await SessionService.getForUUID(uuid, {_noRowsError: l._f('Row for UUID %s does not exist', uuid)})
        if (session) {
            if (conf.sessionCache[session.authToken])
                delete conf.sessionCache[session.authToken];

            return conf.global.models.Session.destroy({where:{uuid: uuid}});
        }
    },
};

module.exports = SessionService;