'use strict';

import {RoleParentSiteService} from './role_parent_site.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties, completeAssociationOptions} from 'sql-util';

export class RoleService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Role;
    references = {
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'role';

    constructor() {
        super();
        this.siteService = conf.global.services.Site.singleton();
    }

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Role', 'name', 'title');
        return true;
    }

    async getListOptions(options) {
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
     * Gets the direct (first level) roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getForUsernameAndSiteName(username, siteName, options) {
        await checkDataForMissingProperties({username, siteName}, 'Role', 'username', 'siteName');
        
        options ??= {};
        options.include ??= [];
        options.include.push(
            completeAssociationOptions({model: conf.global.models.User, where: {username}}, options),
            completeAssociationOptions({model: conf.global.models.Site, where: {name: siteName}}, options),
        );

        return this.model.findAll(options);
    }

    /**
     * Gets the direct (first level) role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getNameForUsernameAndSiteName(username, siteName, options) {
        const roleList = await this.getForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return roleList.map(role => role.name);
    }

    /**
     * Gets all of the roles ID for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getAllIdsForUsernameAndSiteName(username, siteName, options) {
        const site = await this.siteService.getForName(siteName, {isEnabled: true});
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
                    model: this.model,
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
                    model: this.model,
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
        
        let newRoleList = await this.getForUsernameAndSiteName(username, siteName, {attributes: ['id'], skipThroughAssociationAttributes: true});
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
    async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await this.getAllIdsForUsernameAndSiteName(username, siteName, options);
        return this.getList({...options, where: {id:roleIdList ?? null, ...options?.where, }});
    }

    /**
     * Gets all of the role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getAllNamesForUsernameAndSiteName(username, siteName, options) {
        const roleList = await this.getAllForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(await roleList.map(role => role.name));
    }
}