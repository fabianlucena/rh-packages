import { ServiceOwnerModuleTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class RolePermissionService extends ServiceOwnerModuleTranslatable {
  references = {
    role: true,
    permission: true,
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Permission', 'roleId', 'permissionId');
    return super.validateForCreation(data);
  }

  /**
   * Creates a new RolePermission row into DB if not exists.
   * @param {data} data - data for the new RolePermission.
   * @returns {Promise{Permission}}
   */
  async createIfNotExists(data, options) {
    data = await this.completeReferences(data);
    await checkDataForMissingProperties(data, 'Permission', 'roleId', 'permissionId');

    options = {
      ...options,
      attributes: ['roleId', 'permissionId'],
      where: {
        roleId: data.roleId,
        permissionId: data.permissionId,
      },
      include: [],
      limit: 1,
    };

    const rows = await this.getList(options);
    if (rows?.length) {
      return rows[0];
    }

    return this.create(data);
  }
}