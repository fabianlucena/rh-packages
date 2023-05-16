import {RoleService} from './role.js';
import {conf} from '../conf.js';
import {addEnabledOnerModuleFilter, MissingPropertyError, checkDataForMissingProperties, skipAssociationAttributes, completeIncludeOptions} from 'sql-util';
import {complete} from 'rf-util';

export class UserRoleSiteService {
    /**
     * Complete the data object with the userId property if not exists. 
     * @param {{username: string, userId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserId(data) {
        if (!data.userId && data.username)
            data.userId = await conf.global.services.User.getIdForUsername(data.username);

        return data;
    }
    
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeRoleId(data) {
        if (!data.roleId && data.role)
            data.roleId = await RoleService.getIdForName(data.role);

        return data;
    }

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSiteId(data) {
        if (!data.siteId && data.site)
            data.siteId = await conf.global.services.Site.getIdForName(data.site, {foreign:{module: false}});

        return data;
    }

    /**
     * Complete the data object with the userId, roleId, and siteId properties if not exists. 
     * @param {{username: string, userId, role: string, roleId: integer, site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserIdRoleIdSiteId(data) {
        await UserRoleSiteService.completeUserId(data);
        await UserRoleSiteService.completeRoleId(data);
        await UserRoleSiteService.completeSiteId(data);
    }
    
    /**
     * Creates a new UserRoleSite row into DB. Assign user roles in a site. 
     * @param {{userId: integer, roleId: integer, siteId: integer} data - data for the new UserRoleSite.
     * @returns {Promise{UserRoleSite}}
     */
    static async create(data) {
        await UserRoleSiteService.completeUserIdRoleIdSiteId(data);

        await checkDataForMissingProperties(data, 'UserRoleSite', 'userId', 'roleId', 'siteId');

        return conf.global.models.UserRoleSite.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid'];
        }

        if (options.includeUser)
            completeIncludeOptions(
                options,
                'User',
                {
                    model: conf.global.models.User,
                    attributes: options.view? ['uuid', 'username', 'displayName', 'isTranslatable']: null
                }
            );

        if (options.includeRole)
            completeIncludeOptions(
                options,
                'User',
                {
                    model: conf.global.models.Role,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );
        

        if (options.includeSite)
            completeIncludeOptions(
                options,
                'User',
                {
                    model: conf.global.models.Site,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );

        return options;
    }

    /**
     * Gets a list of UserRoleSite.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    static async getList(options) {
        return conf.global.models.UserRoleSite.findAll(await UserRoleSiteService.getListOptions(options));
    }

    static async getListAndCount(options) {
        return conf.global.models.UserRoleSite.findAndCountAll(await UserRoleSiteService.getListOptions(options));
    }

    /**
     * Creates a new UserRoleSite row into DB if not exists.
     * @param {data} data - data for the new UserRoleSite.
     * @returns {Promise{UserRoleSite}}
     */
    static async createIfNotExists(data, options) {
        options = {...options, attributes: ['userId', 'roleId', 'siteId'], where: {}, include: [], limit: 1};

        if (data.userId)
            options.where.userId = data.userId;
        else if (data.username)
            options.include.push(complete({model: conf.global.models.User, where: {username: data.username}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserRoleSite', 'user', 'userId');

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(complete({model: conf.global.models.Role, where: {name: data.role}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserRoleSite', 'role', 'roleId');
        
        if (data.siteId)
            options.where.siteId = data.siteId;
        else if (data.site)
            options.include.push(complete({model: conf.global.models.Site, where: {name: data.site}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserRoleSite', 'site', 'siteId');

        const rowList = await UserRoleSiteService.getList(options);
        if (rowList.length)
            return rowList[0];

        return UserRoleSiteService.create(data);
    }
}