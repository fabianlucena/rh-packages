import {RoleService} from './role.js';
import {PermissionService} from './permission.js';
import {conf} from '../conf.js';
import {complete} from 'rf-util';

complete(
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

export class PrivilegesService {
    /**
     * Gets the privileges data for a given username and site name.
     * @param {string} username - username for the privileges to get.
     * @param {string} siteName - siteName for the privileges to get.
     * @returns {Promise{{}}}
     */
    static async getForUsernameAndSiteName(username, siteName) {
        const privileges = {};

        if (username)
            privileges.sites = await conf.global.services.Site.getNameForUsername(username);
        else
            privileges.sites = [];

        privileges.site = siteName ?? null;

        if (siteName && username)
            privileges.roles = await RoleService.getAllNameForUsernameAndSiteName(username, siteName);
        
        if (!privileges.roles)
            privileges.roles = [];

        if (username && !privileges.roles.includes('admin') && siteName != 'system') {
            const systemRoles = await RoleService.getNameForUsernameAndSiteName(username, 'system');
            if (systemRoles.includes('admin'))
                privileges.roles.push('admin');
        }

        if (siteName) {
            if (privileges.roles.includes('admin'))
                privileges.permissions = await PermissionService.getAllNameForSiteName(siteName);
            else if (username)
                privileges.permissions = await PermissionService.getAllNameForUsernameAndSiteName(username, siteName);
        }
        
        if (!privileges.permissions)
            privileges.permissions = [];

        if (!username)
            privileges.permissions = privileges.permissions.concat(await PermissionService.getAllNameForType('anonymous'));
        else
            privileges.permissions = privileges.permissions.concat(await PermissionService.getAllNameForType('global'));

        privileges.permissions = privileges.permissions.concat(await PermissionService.getAllNameForType('public'));

        return privileges;
    }

    /**
     * Get the privileges for a given username and session ID from the cache or from the DB. @see getForUsernameAndSiteName method.
     * @param {string} username - username for the privileges to get.
     * @param {integer} sessionId - value for the ID to get the site.
     * @returns {Promise{privileges}}
     */
    static async getJSONForUsernameAndSessionIdCached(username, sessionId) {
        let site;
        if (sessionId) {
            if (conf.privilegesCache && conf.privilegesCache[sessionId]) {
                const provilegeData = conf.privilegesCache[sessionId];
                provilegeData.lastUse = Date.now();
                return provilegeData.privileges;
            }

            site = await conf.global.services.Site.getForSessionIdOrDefault(sessionId);
        }
        
        const privileges = await PrivilegesService.getForUsernameAndSiteName(username, site?.name);
        privileges.site = site?.toJSON();

        if (sessionId) {
            conf.privilegesCache[sessionId] = {
                privileges: privileges,
                lastUse: Date.now(),
            };
        }

        return privileges;
    }
}
