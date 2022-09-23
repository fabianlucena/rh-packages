const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

ru.complete(
    conf,
    {
        siteCache: {},
        siteCacheValidityTime: 60000,
        siteCacheMaxLength: 10000,
        siteCacheMaintenanceInterval: 10000,
        siteCacheMaintenanceMethod: () => {
            const expiration = new Date(Date.now() - conf.siteCacheValidityTime);
            const list = [];
            for (const authToken in conf.siteCache) {
                const item = conf.siteCache[authToken];
                if (item.lastUse < expiration) {
                    delete conf.siteCache[authToken];
                } else {
                    list.push({
                        authToken: authToken,
                        lastUse: conf.siteCache[authToken].lastUse,
                    });
                }
            }

            list.sort((a, b) => a.lastUse - b.lastUse)
            list.slice(conf.siteCacheMaxLength).forEach(item => delete conf.siteCache[item.authToken]);
        },
    }
);

conf.init.push(() => conf.siteCacheMaintenance = setInterval(conf.siteCacheMaintenanceMethod, conf.siteCacheMaintenanceInterval));

const SiteService = {
    /**
     * Gets a list of sites. If not isEnabled filter provided returns only the enabled sites.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SiteList}}
     */
    getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}});
        sqlUtil.completeIncludeOptions(options, 'module', {model: conf.global.models.Module, where: {isEnabled: true}, required: false, skipThroughAssociationAttributes: true});
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'name', 'title'];
        }

        return conf.global.models.Site.findAll(options);
    },

    /**
     * Gets a site for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    async getForName(name, options) {
        const rowList = await SiteService.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}));
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['site', ['name = %s', name], 'Site']}));
    },

    /**
     * Gets a site ID from its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ID}}
     */
    async getIdForName(name, options) {
        return (await SiteService.getForName(name, ru.merge(options, {attributes: ['id']}))).id;
    },

    /**
     * Gets the site for a given session ID.
     * @param {itneger} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site]}}
     */
     async getForSessionId(sessionId, options) {
        options = ru.complete(options, {include: [], limit: 2});
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.Session, where: {id: sessionId}}, options));

        const rowList = await SiteService.getList(options);
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['site', ['session id = %s', sessionId], 'Site']}));
    },
   
    /**
     * Get a site for a given session ID value from the cache or from the DB. @see getForSessionId method.
     * @param {integer} sessionId - value for the ID to get the site.
     * @returns {Promise{site}}
     */
    async getForSessionIdCached(sessionId) {
        if (conf.siteCache && conf.siteCache[sessionId]) {
            const siteData = conf.siteCache[sessionId];
            siteData.lastUse = Date.now();
            return siteData.site;
        }

        const site = await SiteService.getForSessionId(sessionId, {skipThroughAssociationAttributes: true, skipNoRowsError: true});
        if (!site)
            return;

        conf.siteCache[sessionId] = {
            site: site,
            lastUse: Date.now(),
        };

        return site;
    },

    /**
     * Gets a site list for a user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    getForUsername(username, options) {
        options = ru.complete(options, {include: []});       
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.User, where: {username: username}}, options));

        return SiteService.getList(options);
    },

    /**
     * Gets a site name list for a user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    getNameForUsername(username, options) {
        return SiteService.getForUsername(username, ru.merge(options, {attributes: ['name'], skipThroughAssociationAttributes: true}))
            .then(async list => list.map(role => role.name));
    },
};

module.exports = SiteService;