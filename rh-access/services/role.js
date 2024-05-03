import { ServiceIdUuidNameTitleEnabledOwnerModuleTranslatable, Op } from 'rf-service';
import dependency from 'rf-dependency';
import { checkDataForMissingProperties } from 'sql-util';

export class RoleService extends ServiceIdUuidNameTitleEnabledOwnerModuleTranslatable {
  references = {
    users: { service: 'userService', whereColumn: 'username' },
    sites: { service: 'siteService', whereColumn: 'name' },
  };
  
  init() {
    super.init();

    this.siteService = dependency.get('siteService');
    this.roleParentSiteService = dependency.get('roleParentSiteService');
  }

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Role', 'name', 'title');
    return super.validateForCreation(data);
  }

  /**
   * Gets the direct (first level) roles for a given username and site name.
   * @param {string} username - username for the user to retrive its roles.
   * @param {string} siteName - siteName in wich the user has the roles.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{RoleList}}
   */
  async getForUsernameAndSiteName(username, siteName, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        users: username,
        sites: siteName,
      }
    };

    return this.getList(options);
  }

  /**
   * Gets the direct (first level) role names for a given username and site name.
   * @param {string} username - username for the user to retrive its roles.
   * @param {string} siteName - siteName in wich the user has the roles.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]string}}
   */
  async getNameForUsernameAndSiteName(username, siteName, options) {
    const roleList = await this.getForUsernameAndSiteName(username, siteName, { ...options, attributes: ['name'], skipThroughAssociationAttributes: true });
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
    const isEnabled = options?.isEnabled ?? true;

    const siteId = await this.siteService.getIdForName(siteName, { isEnabled });
    if (!siteId || (Array.isArray(siteId) && !siteId.length)) {
      return;
    }

    let newRoleList = await this.getForUsernameAndSiteName(
      username,
      siteName,
      {
        isEnabled,
        attributes: ['id'],
        skipThroughAssociationAttributes: true,
      }
    );
    let allRoleIdList = await newRoleList.map(role => role.id);
    let newRoleIdList = allRoleIdList;
        
    const roleParentSiteService = this.roleParentSiteService;
    const parentOptions = {
      ...options,
      attributes: ['parentId'],
      where: { siteId },
    };
    while (newRoleList.length) {
      parentOptions.where.roleId = { [Op.in]: newRoleIdList };
      parentOptions.where.parentId = { [Op.notIn]: allRoleIdList };

      newRoleList = await roleParentSiteService.getList(parentOptions);
      if (!newRoleList.length) {
        break;
      }

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
    return this.getList({ ...options, where: { id:roleIdList ?? null, ...options?.where, }});
  }

  /**
   * Gets all of the role names for a given username and site name.
   * @param {string} username - username for the user to retrive its roles.
   * @param {string} siteName - siteName in wich the user has the roles.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]string}}
   */
  async getAllNamesForUsernameAndSiteName(username, siteName, options) {
    const roleList = await this.getAllForUsernameAndSiteName(username, siteName, { ...options, attributes: ['name'], skipThroughAssociationAttributes: true });
    return Promise.all(await roleList.map(role => role.name));
  }
}