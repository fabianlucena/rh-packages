import {conf} from '../conf.js';
import {complete, deepComplete} from 'rofa-util';

export class RoleParentSiteService {
    /**
     * Gets a list of parent roles per site.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    async getList(options) {
        return conf.global.models.RoleParentSite.findAll(deepComplete(options));
    }

    /**
     * Gets a list of parent roles per site for a given role list and site name.
     * @param {integer|[]integer} roleId - role ID to get its parents.
     * @param {integer} siteId - site ID in which get the parent roles.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    getForRoleIdAndSiteId(roleId, siteId, options) {
        return RoleParentSiteService.getList(complete(options, {where:{roleId: roleId, siteId: siteId}}));
    }
}