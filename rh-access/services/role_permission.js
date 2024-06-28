import { RoleService } from './role.js';
import { PermissionService } from './permission.js';
import { conf } from '../conf.js';
import { ServiceModuleTranslatable } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class RolePermissionService extends ServiceModuleTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.RolePermission;
  moduleModel = conf.global.models.Module;
  moduleService = conf.global.services.Module.singleton();
  references = {
    role: RoleService.singleton(),
    permission: PermissionService.singleton(),
  };
  defaultTranslationContext = 'rolePermission';

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