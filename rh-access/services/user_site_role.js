import {RoleService} from './role.js';
import {conf} from '../conf.js';
import {addEnabledOnerModuleFilter, MissingPropertyError, checkDataForMissingProperties, skipAssociationAttributes, completeIncludeOptions, arrangeOptions} from 'sql-util';
import {complete} from 'rf-util';

export class UserSiteRoleService {
    /**
     * Complete the data object with the userId property if not exists. 
     * @param {{username: string, userId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserId(data) {
        if (!data.userId) {
            if (data.userUuid)
                data.userId = await conf.global.services.User.getIdForUuid(data.userUuid);
            else if (data.username)
                data.userId = await conf.global.services.User.getIdForUsername(data.username);
        }

        return data;
    }

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSiteId(data) {
        if (!data.siteId) {
            if (data.siteUuid)
                data.siteId = await conf.global.services.Site.getIdForUuid(data.siteUuid);
            else if (data.site)
                data.siteId = await conf.global.services.Site.getIdForName(data.site);
        }

        return data;
    }
    
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeRoleId(data) {
        if (!data.roleId) {
            if (data.roleUuid)
                data.roleId = await RoleService.getIdForUuid(data.roleUuid);
            else if (data.role)
                data.roleId = await RoleService.getIdForName(data.role);
        }

        return data;
    }

    /**
     * Complete the data object with the userId, roleId, and siteId properties if not exists. 
     * @param {{username: string, userId, site: string, siteId: integer, role: string, roleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserIdRoleIdSiteId(data) {
        await UserSiteRoleService.completeUserId(data);
        await UserSiteRoleService.completeSiteId(data);
        await UserSiteRoleService.completeRoleId(data);
    }
    
    /**
     * Creates a new UserSiteRole row into DB. Assign user roles in a site. 
     * @param {{userId: integer, siteId: integer, roleId: integer} data - data for the new UserSiteRole.
     * @returns {Promise{UserSiteRole}}
     */
    static async create(data) {
        await UserSiteRoleService.completeUserIdRoleIdSiteId(data);

        await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId', 'roleId');

        return conf.global.models.UserSiteRole.create(data);
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

        if (options.includeUser) {
            completeIncludeOptions(
                options,
                'User',
                options.includeUser,
                {
                    model: conf.global.models.User,
                    attributes: options.view? ['uuid', 'username', 'displayName', 'isTranslatable']: null
                }
            );

            delete options.includeUser;
        }
        

        if (options.includeSite) {
            completeIncludeOptions(
                options,
                'Site',
                options.includeSite,
                {
                    model: conf.global.models.Site,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );

            delete options.includeSite;
        }

        if (options.includeRole) {
            completeIncludeOptions(
                options,
                'Role',
                options.includeRole,
                {
                    model: conf.global.models.Role,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );

            delete options.includeRole;
        }

        arrangeOptions(options, conf.global.sequelize);

        return options;
    }

    /**
     * Gets a list of UserSiteRole.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    static async getList(options) {
        return conf.global.models.UserSiteRole.findAll(await UserSiteRoleService.getListOptions(options));
    }

    static async getListAndCount(options) {
        return conf.global.models.UserSiteRole.findAndCountAll(await UserSiteRoleService.getListOptions(options));
    }

    /**
     * Creates a new UserSiteRole row into DB if not exists.
     * @param {data} data - data for the new UserSiteRole.
     * @returns {Promise{UserSiteRole}}
     */
    static async createIfNotExists(data, options) {
        options = {...options, attributes: ['userId', 'siteId', 'roleId'], where: {}, include: [], limit: 1};

        if (data.userId)
            options.where.userId = data.userId;
        else if (data.username)
            options.include.push(complete({model: conf.global.models.User, where: {username: data.username}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'user', 'userId');
        
        if (data.siteId)
            options.where.siteId = data.siteId;
        else if (data.site)
            options.include.push(complete({model: conf.global.models.Site, where: {name: data.site}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'site', 'siteId');

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(complete({model: conf.global.models.Role, where: {name: data.role}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'role', 'roleId');

        const rowList = await UserSiteRoleService.getList(options);
        if (rowList.length)
            return rowList[0];

        return UserSiteRoleService.create(data);
    }

    static async delete(where, options) {
        const Op = conf.global.Sequelize.Op;

        if (where?.userUuid && !where.userId) {
            where.userId = await conf.global.services.User.getIdForUuid(where.userUuid);
            delete where.userUuid;
        }

        if (where?.siteUuid && !where.siteId) {
            where.siteId = await conf.global.services.Site.getIdForUuid(where.siteUuid);
            delete where.siteUuid;
        }

        if (where?.roleUuid && !where.roleId) {
            where.roleId = await conf.global.services.Role.getIdForUuid(where.roleUuid);
            delete where.roleUuid;
        }

        if (where?.notRoleId) {
            const condition = {[Op.notIn]: where.notRoleId};
            if (where.roleId)
                where.roleId = {[Op.and]: [where.roleId, condition]};
            else
                where.roleId = condition;

            delete where.notRoleId;
        }

        return conf.global.models.UserSiteRole.destroy({...options, where: {...options?.where, ...where}});
    }
}