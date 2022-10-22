const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const SiteService = {
    /**
     * Creates a new Site row into DB.
     * @param {{
     *  isEnabled: boolean,
     *  name: string,
     *  title: string,
     * }} data - data for the new Site.
     *  - name must be unique.
     * @returns {Promise{Site}}
     */
    async create(data) {
        await sqlUtil.checkDataForMissingProperties(data, 'Site', 'name', 'title');
        return conf.global.models.Site.create(data);
    },

    /**
     * Creates a new Site row into DB if not exists.
     * @param {data} data - data for the new Site @see SiteService.create.
     * @returns {Promise{Site}}
     */
    createIfNotExists(data, options) {
        return SiteService.getForName(data.name, ru.merge({attributes: ['id'], skipNoRowsError: true}, options))
            .then(element => {
                if (element)
                    return element;

                return SiteService.create(data);
            });
    },

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

            const includedUserOptions = sqlUtil.getIncludedModelOptions(options, conf.global.models.User);
            if (includedUserOptions) {
                if (!includedUserOptions.attributes) {
                    includedUserOptions.attributes = [];
                }
            }
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
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    async getForSessionId(sessionId, options) {
        options = ru.complete(options, {include: [], limit: 2});
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.Session, where: {id: sessionId}}, options));

        const rowList = await SiteService.getList(options);
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['site', ['session id = %s', sessionId], 'Site']}));
    },

    /**
     * Gets the site for a given session ID or default site if it is configured. This method uses the @ref SiteService.getForSessionId
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    async getForSessionIdOrDefault(sessionId, options) {
        let site = await SiteService.getForSessionId(sessionId, ru.merge(options, {skipThroughAssociationAttributes: true, skipNoRowsError: true}));
        if (site)
            return site;

        if (!conf.global.data.defaultSite)
            return;

        const SessionSiteService = require('./session_site');
        await SessionSiteService.createOrUpdate({
            sessionId: sessionId,
            site: conf.global.data.defaultSite,
        });

        return await SiteService.getForSessionId(sessionId, ru.merge(options, {skipThroughAssociationAttributes: true, skipNoRowsError: true}));
    },

    /**
     * Gets a site list for an user with the username.
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
     * Gets a site name list for an user with the username.
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