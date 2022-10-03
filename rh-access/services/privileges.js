const RoleService = require('./role');
const SiteService = require('./site');
const PermissionService = require('./permission');
const conf = require('../index');
const ru = require('rofa-util');

ru.complete(
    conf,
    {
        privilegesCache: {},
        privilegesCacheValidityTime: 60000,
        privilegesCacheMaxLength: 10000,
        privilegesCacheMaintenanceInterval: 10000,
        privilegesCacheMaintenanceMethod: () => {
            const expiration = new Date(Date.now() - conf.privilegesCacheValidityTime);
            const list = [];
            for (const authToken in conf.privilegesCache) {
                const item = conf.privilegesCache[authToken];
                if (item.lastUse < expiration) {
                    delete conf.privilegesCache[authToken];
                } else {
                    list.push({
                        authToken: authToken,
                        lastUse: conf.privilegesCache[authToken].lastUse,
                    });
                }
            }

            list.sort((a, b) => a.lastUse - b.lastUse);
            list.slice(conf.privilegesCacheMaxLength).forEach(item => delete conf.privilegesCache[item.authToken]);
        },
    }
);

conf.init.push(() => conf.privilegesCacheMaintenance = setInterval(conf.privilegesCacheMaintenanceMethod, conf.privilegesCacheMaintenanceInterval));

const PrivilegesService = {
    /**
     * Gets the privileges data for a given username and site name.
     * @param {string} username - username for the privileges to get.
     * @param {string} siteName - siteName for the privileges to get.
     * @returns {Promise{{}}}
     */
    async getForUsernameAndSiteName(username, siteName) {
        const result = {
            sites: await SiteService.getNameForUsername(username),
        };

        if (siteName) {
            result.site = siteName;
            result.roles = await RoleService.getAllNameForUsernameAndSiteName(username, siteName);
        }

        if (!result.roles)
            result.roles = [];

        if (!result.roles.includes('admin') && siteName != 'system') {
            const systemRoles = await RoleService.getNameForUsernameAndSiteName(username, 'system');
            if (systemRoles.includes('admin'))
                result.roles.push('admin');
        }

        if (result.roles.includes('admin'))
            result.permissions = await PermissionService.getAllNameForSiteName(siteName);
        else
            result.permissions = await PermissionService.getAllNameForUsernameAndSiteName(username, siteName);

        return result;
    },

    /**
     * Get the privileges for a given username and session ID from the cache or from the DB. @see getForUsernameAndSiteName method.
     * @param {string} username - username for the privileges to get.
     * @param {integer} sessionId - value for the ID to get the site.
     * @returns {Promise{privileges}}
     */
    async getJSONForUsernameAndSessionIdCached(username, sessionId) {
        if (conf.privilegesCache && conf.privilegesCache[sessionId]) {
            const provilegeData = conf.privilegesCache[sessionId];
            provilegeData.lastUse = Date.now();
            return provilegeData.privileges;
        }

        let site = await SiteService.getForSessionIdOrDefault(sessionId);

        const privileges = await PrivilegesService.getForUsernameAndSiteName(username, site?.name);
        privileges.site = site?.toJSON();

        conf.privilegesCache[sessionId] = {
            privileges: privileges,
            lastUse: Date.now(),
        };

        return privileges;
    },
};

module.exports = PrivilegesService;