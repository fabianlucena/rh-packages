'use strict';

import {RoleParentSiteService} from './role_parent_site.js';
import {conf} from '../conf.js';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties, getSingle, completeAssociationOptions} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class RoleService {
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
     * Creates a new Role row into DB.
     * @param {{
     *  name: string,
     *  title: string,
     * }} data - data for the new Role.
     *  - name must be unique.
     * @returns {Promise{Role}}
     */
    static async create(data) {
        await checkDataForMissingProperties(data, 'Role', 'name', 'title');
        await RoleService.completeOwnerModuleId(data);
        return conf.global.models.Role.create(data);
    }

    /**
     * Creates a new Role row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static createIfNotExists(data, options) {
        return RoleService.getForName(data.name, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return RoleService.create(data);
            });
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {username:    {[Op.like]: q}},
                    {displayName: {[Op.like]: q}},
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
     * Gets a list of roles.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static async getList(options) {
        return conf.global.models.Role.findAll(await RoleService.getListOptions(options));
    }
    
    /**
     * Gets a list of roles and the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.Role.findAndCountAll(await RoleService.getListOptions(options));
    }

    /**
     * Gets a role for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the role to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Role}}
     */
    static async getForUuid(uuid, options) {
        const rowList = await RoleService.getList(deepComplete(options, {where:{uuid}, limit: 2}));
        if (Array.isArray(uuid))
            return rowList;

        return getSingle(rowList, deepComplete(options, {params: ['roles', ['UUID = %s', uuid], 'Role']}));
    }

    /**
     * Gets a role for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Role}}
     */
    static async getForName(name, options) {
        const rowList = await RoleService.getList(deepComplete(options, {where:{name}, limit: 2}));
        if (Array.isArray(name))
            return rowList;

        return getSingle(rowList, deepComplete(options, {params: ['roles', ['name = %s', name], 'Role']}));
    }

    /**
     * Gets a role ID for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the role to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForUuid(uuid, options) {
        const result = await RoleService.getForUuid(uuid, {...options, attributes: ['id']});
        if (Array.isArray(uuid))
            return result.map(row => row.id);
        
        return result.id;
    }

    /**
     * Gets a role ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForName(name, options) {
        const result = await RoleService.getForName(name, {...options, attributes: ['id']});
        if (Array.isArray(name))
            return result.map(row => row.id);
        
        return result.id;
    }

    /**
     * Gets the direct (first level) roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    static async getForUsernameAndSiteName(username, siteName, options) {
        await checkDataForMissingProperties({username, siteName}, 'Role', 'username', 'siteName');
        
        options = complete(options, {include: []});
        options.include.push(
            completeAssociationOptions({model: conf.global.models.User, where: {username}}, options),
            completeAssociationOptions({model: conf.global.models.Site, where: {name: siteName}}, options),
        );

        return conf.global.models.Role.findAll(options);
    }

    /**
     * Gets the direct (first level) role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getNameForUsernameAndSiteName(username, siteName, options) {
        const roleList = await RoleService.getForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return roleList.map(role => role.name);
    }

    /**
     * Gets all of the roles ID for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    static async getAllIdsForUsernameAndSiteName(username, siteName, options) {
        const site = await conf.global.services.Site.singleton().getForName(siteName, {isEnabled: true});
        if (!site || (Array.isArray(site) && !site.length))
            return;

        const siteId = site.map(site => site.id);

        const isEnabled = options?.isEnabled ?? true;
        const Op = conf.global.Sequelize.Op;
        const parentOptions = {
            ...options,
            attributes: ['parentId'],
            include: [
                {
                    model: conf.global.models.Role,
                    as: 'Role',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
                            attributes: [],
                            where: {
                                [Op.or]: [
                                    {id: {[Op.eq]: null}},
                                    {isEnabled: {[Op.eq]: isEnabled}},
                                ],
                            },
                        }
                    ],
                    where: {isEnabled},
                },
                {
                    model: conf.global.models.Role,
                    as: 'Parent',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
                            attributes: [],
                            where: {
                                [Op.or]: [
                                    {id: {[Op.eq]: null}},
                                    {isEnabled: {[Op.eq]: isEnabled}},
                                ],
                            },
                        }
                    ],
                    where: {isEnabled},
                },
            ],
            where: {siteId}
        };
        
        let newRoleList = await RoleService.getForUsernameAndSiteName(username, siteName, {attributes: ['id'], skipThroughAssociationAttributes: true});
        let allRoleIdList = await newRoleList.map(role => role.id);
        let newRoleIdList = allRoleIdList;
            
        while(newRoleList.length) {
            parentOptions.where.roleId = {[Op.in]: newRoleIdList};
            parentOptions.where.parentId = {[Op.notIn]: allRoleIdList};

            newRoleList = await RoleParentSiteService.getList(parentOptions);
            if (!newRoleList.length)
                break;

            newRoleIdList = await newRoleList.map(roleParent => roleParent.parentId);
            allRoleIdList = [...allRoleIdList, ...newRoleIdList];
        }

        return allRoleIdList;
    }

    /**
     * Gets all of the roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    static async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await RoleService.getAllIdsForUsernameAndSiteName(username, siteName, options);
        options ??= {};
        options.where = {id:roleIdList ?? null, ...options?.where};
        return RoleService.getList(options);
    }

    /**
     * Gets all of the role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getAllNamesForUsernameAndSiteName(username, siteName, options) {
        const roleList = await RoleService.getAllForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(await roleList.map(role => role.name));
    }
}