import {GroupService} from './group.js';
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
                        authToken,
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
            privileges.sites = await conf.global.services.Site.getNameForUsername(username, {isEnabled: true});
        else
            privileges.sites = [];

        privileges.site = siteName ?? null;

        privileges.roles = ['everybody'];

        if (username) {
            privileges.roles.push('user');
            
            const rolesSiteName = siteName?
                Array.isArray(siteName)?
                    siteName:
                    [siteName]:
                [];

            if (!rolesSiteName.includes('system'))
                rolesSiteName.push('system');
                
            privileges.roles = [...privileges.roles, ...await RoleService.getAllNamesForUsernameAndSiteName(username, rolesSiteName, {isEnabled: true})];
        } else
            privileges.roles.push('anonymous');

        privileges.permissions = await PermissionService.getNamesForRolesName(privileges.roles, {isEnabled: true});

        privileges.groups = await GroupService.getAllNamesForUsername(username, {isEnabled: true});
        
        return privileges;
    }

    /**
     * Get the privileges for a given username and session ID from the cache or from the DB. @see getForUsernameAndSiteName method.
     * @param {string} username - username for the privileges to get.
     * @param {integer} sessionId - value for the ID to get the site.
     * @param {integer} oldSessionId - value for the ID for the old session when the session was created by autoLoginToken.
     * @returns {Promise{privileges}}
     */
    static async getJSONForUsernameAndSessionIdCached(username, sessionId, oldSessionId) {
        let site;
        if (sessionId) {
            if (conf.privilegesCache && conf.privilegesCache[sessionId]) {
                const provilegeData = conf.privilegesCache[sessionId];
                provilegeData.lastUse = Date.now();
                return provilegeData.privileges;
            }

            site = await conf.global.services.Site.getForSessionId(sessionId, {skipThroughAssociationAttributes: true, skipNoRowsError: true});
            if (!site) {
                if (oldSessionId)
                    site = await conf.global.services.Site.getForSessionId(oldSessionId, {skipThroughAssociationAttributes: true, skipNoRowsError: true});

                if (!site && conf.global.data.defaultSite)
                    site = await conf.global.services.Site.getForName(conf.global.data.defaultSite, {skipThroughAssociationAttributes: true, skipNoRowsError: true});

                if (site && conf.global.services.SessionSite?.createOrUpdate) {
                    await conf.global.services.SessionSite?.createOrUpdate({
                        sessionId: sessionId,
                        siteId: site.id,
                    });
                }
            }
        }
        
        const privileges = await PrivilegesService.getForUsernameAndSiteName(username, site?.name);
        privileges.site = site?.toJSON();

        sessionId ||= privileges.site?.id;

        if (sessionId) {
            conf.privilegesCache[sessionId] = {
                privileges: privileges,
                lastUse: Date.now(),
            };
        }

        return privileges;
    }

    static deleteFromCacheForSessionId(sessionId) {
        if (conf.privilegesCache[sessionId]) {
            delete conf.privilegesCache[sessionId];
        }
    }
}
