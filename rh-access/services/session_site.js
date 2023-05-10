import {conf} from '../conf.js';
import {checkDataForMissingProperties, addEnabledFilter} from 'sql-util';

export class SessionSiteService {
    /**
     * Complete the data object with the sessionId property if not exists. 
     * @param {{session: string, sessionId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSessionId(data) {
        if (!data.sessionId && data.session)
            data.sessionId = await conf.global.services.Session.getIdForName(data.session);

        return data;
    }

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSiteId(data) {
        if (!data.siteId && data.site)
            data.siteId = await conf.global.services.Site.getIdForName(data.site, {foreign: {module: false}});

        return data;
    }

    /**
     * Complete the data object with the sessionId, and siteId properties if not exists. 
     * @param {{session: string, sessionId: integer, site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSessionIdAndSiteId(data) {
        await SessionSiteService.completeSessionId(data);
        await SessionSiteService.completeSiteId(data);
    }

    /**
     * Creates a new SessionSite row into DB.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
    static async create(data) {
        await SessionSiteService.completeSessionIdAndSiteId(data);

        await checkDataForMissingProperties(data, 'SessionSite', 'sessionId', 'siteId');

        return conf.global.models.SessionSite.create(data);
    }

    /**
     * Creates a new SessionSite row into DB.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
    static async update(data, options) {
        try {
            await SessionSiteService.completeSessionIdAndSiteId(data);
        } catch(err) {
            err;
        }

        return conf.global.models.SessionSite.update(data, options);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        if (!options.includes) {
            options.include = [];
            options.include.push({
                model: conf.global.models.Site,
                where: {isEnabled: options?.foreign?.site?.where.isEnabled ?? true},
                attributes: options?.foreign?.site?.attributes,
            });
        }

        return options;
    }

    /**
     * Gets a list of session sites.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SessionSiteList}}
     */
    static async getList(options) {
        return conf.global.models.SessionSite.findAll(await SessionSiteService.getListOptions(options));
    }

    /**
     * Updates a existent SessionSite row into DB, for the siteId property.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
    static async updateSite(data) {
        await SessionSiteService.completeSessionIdAndSiteId(data);
        return conf.global.models.SessionSite.update({siteId: data.siteId}, {where: {sessionId: data.sessionId}});
    }

    /**
     * Creates a new SessionSite row into DB or update the siteId property if exists.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
    static async createOrUpdate(data) {
        await SessionSiteService.completeSessionIdAndSiteId(data);
        
        const rowList = await conf.global.models.SessionSite.findAll({where: {sessionId: data.sessionId}});
        if (rowList.length)
            return SessionSiteService.update(data, {where: {sessionId: data.sessionId}});

        return SessionSiteService.create(data);
    }
}