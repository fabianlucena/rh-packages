import {conf} from '../conf.js';
import {MissingPropertyError, checkDataForMissingProperties, completeIncludeOptions, getIncludedModelOptions, getSingle, completeAssociationOptions} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class SiteService {
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId)
            if (!data.ownerModule)
                throw new MissingPropertyError('Site', 'ownerModule', 'ownerModuleId');
            else
                data.ownerModuleId = await conf.global.services.Module.getIdForName(data.ownerModule);

        return data;
    }

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
    static async create(data) {
        await checkDataForMissingProperties(data, 'Site', 'name', 'title');
        await SiteService.completeOwnerModuleId(data);
        return conf.global.models.Site.create(data);
    }

    /**
     * Creates a new Site row into DB if not exists.
     * @param {data} data - data for the new Site @see SiteService.create.
     * @returns {Promise{Site}}
     */
    static createIfNotExists(data, options) {
        return SiteService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return SiteService.create(data);
            });
    }

    /**
     * Gets a list of sites. If not isEnabled filter provided returns only the enabled sites.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SiteList}}
     */
    static getList(options) {
        options = deepComplete(options, {where: {isEnabled: true}});
        completeIncludeOptions(options, 'module', {model: conf.global.models.Module, where: {isEnabled: true}, required: false, skipThroughAssociationAttributes: true});
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'name', 'title'];

            const includedUserOptions = getIncludedModelOptions(options, conf.global.models.User);
            if (includedUserOptions) {
                if (!includedUserOptions.attributes) {
                    includedUserOptions.attributes = [];
                }
            }
        }

        return conf.global.models.Site.findAll(options);
    }

    /**
     * Gets a site for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    static async getForName(name, options) {
        const rowList = await SiteService.getList(deepComplete(options, {where:{name: name}, limit: 2}));
        return getSingle(rowList, deepComplete(options, {params: ['site', ['name = %s', name], 'Site']}));
    }

    /**
     * Gets a site ID from its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ID}}
     */
    static async getIdForName(name, options) {
        return (await SiteService.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Gets the site for a given session ID.
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    static async getForSessionId(sessionId, options) {
        options = complete(options, {include: [], limit: 2});
        options.include.push(completeAssociationOptions({model: conf.global.models.Session, where: {id: sessionId}}, options));

        const rowList = await SiteService.getList(options);
        return getSingle(rowList, deepComplete(options, {params: ['site', ['session id = %s', sessionId], 'Site']}));
    }

    /**
     * Gets the site for a given session ID or default site if it is configured. This method uses the @ref SiteService.getForSessionId
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    static async getForSessionIdOrDefault(sessionId, options) {
        let site;
        if (sessionId) {
            site = await SiteService.getForSessionId(sessionId, {...options, skipThroughAssociationAttributes: true, skipNoRowsError: true});
            if (site)
                return site;
        }

        if (!conf.global.data.defaultSite)
            return;

        if (conf.global.services.SessionSite?.createOrUpdate)
            await conf.global.services.SessionSite?.createOrUpdate({
                sessionId: sessionId,
                site: conf.global.data.defaultSite,
            });

        return await SiteService.getForSessionId(sessionId, {...options, skipThroughAssociationAttributes: true, skipNoRowsError: true});
    }

    /**
     * Gets a site list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    static getForUsername(username, options) {
        options = complete(options, {include: []});       
        options.include.push(completeAssociationOptions({model: conf.global.models.User, where: {username: username}}, options));

        return SiteService.getList(options);
    }

    /**
     * Gets a site name list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    static getNameForUsername(username, options) {
        if (!username)
            return [];

        return SiteService.getForUsername(username, {...options, attributes: ['name'], skipThroughAssociationAttributes: true})
            .then(async list => list.map(role => role.name));
    }
}