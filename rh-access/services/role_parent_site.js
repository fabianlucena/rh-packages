import {conf} from '../conf.js';
import {complete} from 'rf-util';

export class RoleParentSiteService {
    /**
     * Gets a list of parent roles per site.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static async getList(options) {
        return conf.global.models.RoleParentSite.findAll(options);
    }

    /**
     * Gets a list of parent roles per site for a given role list and site name.
     * @param {integer|[]integer} roleId - role ID to get its parents.
     * @param {integer} siteId - site ID in which get the parent roles.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    static getForRoleIdAndSiteId(roleId, siteId, options) {
        return RoleParentSiteService.getList(complete(options, {where:{roleId: roleId, siteId: siteId}}));
    }
}