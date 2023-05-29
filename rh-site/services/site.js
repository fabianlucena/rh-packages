import {conf} from '../conf.js';
import {
    addEnabledFilter,
    addEnabledOnerModuleFilter, 
    checkDataForMissingProperties,
    getIncludedModelOptions,
    getSingle,
    completeAssociationOptions
} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class SiteService {
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId && data.ownerModule)
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
        await SiteService.completeOwnerModuleId(data);
        await checkDataForMissingProperties(data, 'Site', 'name', 'title');

        const site = await conf.global.models.Site.create(data);
        if (data.users) {
            for (const user of data.users)
                await conf.global.services.UserSiteRole.createIfNotExists({user: user.user, siteId: site.id, role: user.role});
        }

        return site;
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
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
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

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets a list of sites.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SiteList}}
     */
    static async getList(options) {
        return conf.global.models.Site.findAll(await SiteService.getListOptions(options));
    }

    /**
     * Gets a list of sites and the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SiteList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.Site.findAndCountAll(await SiteService.getListOptions(options));
    }

    /**
     * Gets a site for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    static async getForUuid(uuid, options) {
        const rowList = await SiteService.getList(deepComplete(options, {where:{uuid}, limit: 2}));
        if (Array.isArray(uuid))
            return rowList;

        return getSingle(rowList, deepComplete(options, {params: ['site', ['uuid = %s', uuid], 'Site']}));
    }

    /**
     * Gets a site for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    static async getForName(name, options) {
        options = {...options, where:{...options?.where, name}};
        if (!Array.isArray(name))
            options.limit = 2;

        const rowList = await SiteService.getList(options);
        if (Array.isArray(name))
            return rowList;

        return getSingle(rowList, deepComplete(options, {params: ['site', ['name = %s', name], 'Site']}));
    }

    /**
     * Gets a site ID from its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ID}}
     */
    static async getIdForUuid(uuid, options) {
        const result = await SiteService.getForUuid(uuid, {...options, attributes: ['id']});
        if (Array.isArray(uuid))
            return result.map(row => row.id);
        
        return result.id;
    }

    /**
     * Gets a site ID from its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the site type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ID}}
     */
    static async getIdForName(name, options) {
        const result = await SiteService.getForName(name, {...options, attributes: ['id']});
        if (Array.isArray(name))
            return result.map(row => row.id);
        
        return result?.id;
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
        return getSingle(rowList, {params: ['site', ['session id = %s', sessionId], 'Site'], ...options});
    }
    /**
     * Gets a site list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    static getForUsername(username, options) {
        options.include ??= [];       
        options.include.push(completeAssociationOptions({model: conf.global.models.User, where: {username}}, options));

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