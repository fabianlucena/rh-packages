'use strict';

import {RoleService} from './role.js';
import {conf} from '../conf.js';
import {addEnabledOnerModuleFilter, checkDataForMissingProperties} from 'sql-util';
import {complete} from 'rf-util';

export class RoleParentSiteService {
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
     * Complete the data object with the parentId property if not exists. 
     * @param {{parent: string, parentId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeParentId(data) {
        if (!data.parentId && data.parent)
            data.parentId = await RoleService.getIdForName(data.parent);

        return data;
    }

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSiteId(data) {
        if (!data.siteId && data.site)
            data.siteId = await conf.global.services.Site.singleton().getIdForName(data.site);

        return data;
    }

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
     * Creates a new role parent per site row into DB.
     * @param {{
     *  role: string,
     *  roleId: int,
     *  parent: string,
     *  parentId: int,
     *  site: string,
     *  siteId: int,
     * }} data - data for the new Role.
     * @returns {Promise{Role}}
     */
    static async create(data) {
        await RoleParentSiteService.completeRoleId(data);
        await RoleParentSiteService.completeParentId(data);
        await RoleParentSiteService.completeSiteId(data);
        await RoleParentSiteService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'RoleParentSiteService', 'roleId', 'parentId');

        return conf.global.models.RoleParentSite.create(data);
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

        return options;
    }

    /**
     * Gets a list of parent roles per site.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static async getList(options) {
        return conf.global.models.RoleParentSite.findAll(await RoleParentSiteService.getListOptions(options));
    }

    /**
     * Gets a list of parent roles per site and the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.RoleParentSite.findAndCountAll(await RoleParentSiteService.getListOptions(options));
    }

    /**
     * Gets a list of parent roles per site for a given role list and site name.
     * @param {integer|[]integer} roleId - role ID to get its parents.
     * @param {integer} siteId - site ID in which get the parent roles.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static getForRoleIdAndSiteId(roleId, siteId, options) {
        return RoleParentSiteService.getList(complete(options, {where:{roleId, siteId}}));
    }

    /**
     * Creates a new parent role per site row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static async createIfNotExists(data, options) {
        await RoleParentSiteService.completeRoleId(data);
        await RoleParentSiteService.completeParentId(data);
        await RoleParentSiteService.completeSiteId(data);
        await RoleParentSiteService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'RoleParentSiteService', 'roleId', 'parentId', 'siteId');
        
        const rows = await RoleParentSiteService.getList(complete(options, {where:{roleId: data.roleId, parentId: data.parentId, siteId: data.siteId}}));
        if (rows && rows.length)
            return true;

        return RoleParentSiteService.create(data);
    }
}