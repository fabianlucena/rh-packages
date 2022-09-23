const RoleService = require('./role');
const SiteService = require('./site');
const PermissionService = require('./permission');
const ru = require('rofa-util');

const PrivilegesService = {
    /**
     * Gets a privilege data for a given username and site name.
     * @param {string} username - username for the privileges to get.
     * @param {string} siteName - siteName for the privileges to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{{}}}
     */
    async getForUsernameAndSiteName(username, siteName, options) {
        const result = {
            sites: await SiteService.getNameForUsername(username),
        };

        if (siteName) {
            result.site = {
                name: siteName,
                roles: await RoleService.getAllNameForUsernameAndSiteName(username, siteName),
                permissions: await PermissionService.getAllNameForUsernameAndSiteName(username, siteName),
            };
        } else {
            result.warning = await options.locale._('No current site selected');
        }

        return result;
    },
};

module.exports = PrivilegesService;