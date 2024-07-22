import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { complete } from 'rf-util';
import dependency from 'rf-dependency';
import { ForbiddenMethodError } from './errors.js';

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

export class PrivilegesService extends Service.Base {
  model = false;

  init() {
    super.init();

    this.siteService =        dependency.get('siteService', null);
    this.sessionSiteService = dependency.get('sessionSiteService', null);
    this.roleService =        dependency.get('roleService');
    this.permissionService =  dependency.get('permissionService');
    this.groupService =       dependency.get('groupService');

  }

  async create() {
    throw new ForbiddenMethodError(loc => loc._c('privileges', 'Cannot create privileges, privileges is a container not an entity.'));
  }

  async getList() {
    throw new ForbiddenMethodError(loc => loc._c('privileges', 'Cannot get privileges, privileges is a container not an entity.'));
  }

  async update() {
    throw new ForbiddenMethodError(loc => loc._c('privileges', 'Cannot update privileges, privileges is a container not an entity.'));
  }

  async delete() {
    throw new ForbiddenMethodError(loc => loc._c('privileges', 'Cannot delete privileges, privileges is a container not an entity.'));
  }

  /**
   * Gets the privileges data for a given username and site name.
   * @param {string} username - username for the privileges to get.
   * @param {string} siteName - siteName for the privileges to get.
   * @returns {Promise{{}}}
   */
  async getForUsernameAndSiteName(username, siteName) {
    const privileges = {};

    if (username) {
      privileges.sites = await this.siteService.getNameForUsername(username, { isEnabled: true });
    } else {
      privileges.sites = [];
    }

    privileges.site = siteName ?? null;

    privileges.roles = ['everybody'];

    if (username) {
      privileges.roles.push('user');
            
      const rolesSiteName = siteName?
        Array.isArray(siteName)?
          siteName:
          [siteName]:
        [];

      if (!rolesSiteName.includes('system')) {
        rolesSiteName.push('system');
      }
                
      privileges.roles.push(
        ...await this.roleService.getAllNamesForUsernameAndSiteName(username, rolesSiteName, { isEnabled: true })
      );
    } else {
      privileges.roles.push('anonymous');
    }

    privileges.permissions = await this.permissionService.getNamesForRolesName(privileges.roles, { isEnabled: true });

    privileges.groups = await this.groupService.getAllNamesForUsername(username, { isEnabled: true });
        
    return privileges;
  }

  /**
   * Get the privileges for a given username and session ID from the cache or from the DB. @see getForUsernameAndSiteName method.
   * @param {string} username - username for the privileges to get.
   * @param {integer} sessionId - value for the ID to get the site.
   * @returns {Promise{privileges}}
   */
  async getJSONForUsernameAndSessionIdCached(username, sessionId) {
    if (!username || !sessionId) {
      return;
    }
    
    let site;
    if (sessionId) {
      if (conf.privilegesCache && conf.privilegesCache[sessionId]) {
        const privilegeData = conf.privilegesCache[sessionId];
        privilegeData.lastUse = Date.now();
        return privilegeData.privileges;
      }

      if (this.siteService) {
        site = await this.siteService.getForSessionId(
          sessionId,
          {
            skipThroughAssociationAttributes: true,
            skipNoRowsError: true,
          },
        );
        if (!site) {
          if (!site && conf.global.data.defaultSite) {
            site = await this.siteService.getForName(
              conf.global.data.defaultSite,
              {
                skipThroughAssociationAttributes: true,
                skipNoRowsError: true,
              },
            );
          }

          if (site) {
            await this.sessionSiteService?.createOrUpdate({
              sessionId,
              siteId: site.id,
            });
          }
        }
      }
    }
        
    const privileges = await this.getForUsernameAndSiteName(username, site?.name);
    privileges.site = site;

    sessionId ||= privileges.site?.id;

    if (sessionId) {
      conf.privilegesCache[sessionId] = {
        privileges: privileges,
        lastUse: Date.now(),
      };
    }

    return privileges;
  }

  deleteFromCacheForSessionId(sessionId) {
    if (conf.privilegesCache[sessionId]) {
      delete conf.privilegesCache[sessionId];
    }
  }
}
