import { RolePermissionService } from './role_permission.js';
import { ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable } from 'rf-service';
import { runSequentially } from 'rf-util';

export class PermissionService extends ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable {
  references = {
    roles: 'roleService',
  };
  defaultTranslationContext = 'user';

  /**
   * Creates a new Permission row into DB if not exists.
   * @param {data} data - data for the new Permission @see create.
   * @returns {Promise{Permission}}
   */
  async createIfNotExists(data, options) {
    const result = await super.createIfNotExists(data, options);
    if (data.roles) {
      const roles = Array.isArray(data.roles)?
        data.roles:
        data.roles.split(',');

      await runSequentially(roles, async roleName => await RolePermissionService.singleton().createIfNotExists({ role: roleName, permission: data.name, ownerModule: data.ownerModule }));
    }

    return result;
  }

  /**
   * Gets a permission list for a given roles names list.
   * @param {Array[string]} rolesName - list of roles name.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{Permission}}
   */
  async getForRolesName(rolesName, options) {
    options = { include: {}, ...options };
    options.include.roles = {
      ...options?.include?.roles,
      where: {
        ...options?.include?.roles?.where,
        name: rolesName,
      },
    };

    return this.getList(options);
  }

  /**
   * Gets a permission name list for a given roles names list.
   * @param {Array[string]} rolesName - list of roles name.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]string}}
   */
  async getNamesForRolesName(rolesName, options) {
    const permissionList = await this.getForRolesName(rolesName, { ...options, attributes: ['name'], skipThroughAssociationAttributes: true });
    return Promise.all(permissionList.map(permission => permission.name));
  }
}