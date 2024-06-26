import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class RoleParentSiteService extends Service.OwnerModuleTranslatable {
  references = {
    role:   true,
    parent: 'roleService',
    site:   true,
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'RoleParentSiteService', 'roleId', 'parentId');
    return super.validateForCreation(data);
  }

  /**
   * Gets a list of parent roles per site for a given role list and site name.
   * @param {integer|[]integer} roleId - role ID to get its parents.
   * @param {integer} siteId - site ID in which get the parent roles.
   * @param {Options} options - options for the @ref sequelize.findAll method.
   * @returns {Promise{RoleList}}
   */
  getForRoleIdAndSiteId(roleId, siteId, options) {
    return this.getList({ ...options, where: { ...options?.where, roleId, siteId }});
  }

  /**
   * Creates a new parent role per site row into DB if not exists.
   * @param {data} data - data for the new Role @see create.
   * @returns {Promise{Role}}
   */
  async createIfNotExists(data, options) {
    await this.completeReferences(data);
    await checkDataForMissingProperties(data, 'RoleParentSiteService', 'roleId', 'parentId', 'siteId');
        
    const rows = await this.getList({
      ...options,
      where: {
        ...options?.where,
        roleId: data.roleId,
        parentId: data.parentId,
        siteId: data.siteId
      },
    });
    if (rows?.length) {
      return rows[0];
    }

    return this.create(data);
  }
}