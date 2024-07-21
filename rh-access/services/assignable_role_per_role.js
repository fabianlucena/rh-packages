import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class AssignableRolePerRoleService extends Service.OwnerModule {
  references = {
    role: true,
    assignableRole: 'roleService',
  };

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'AssignableRolePerRole', 'roleId', 'assignableRoleId');
    
    return super.validateForCreation(data);
  }

  /**
   * Creates a new row into DB if not exists.
   * @param {data} data - data for the new Role @see create.
   * @returns {Promise{Role}}
   */
  async createIfNotExists(data, options) {
    if (Array.isArray(data.assignableRole)) {
      const rows = [];
      for (const assignableRole of data.assignableRole) {
        rows.push(await this.createIfNotExists({ ...data, assignableRole }, options));
      }

      return rows;
    }

    if (Array.isArray(data.role)) {
      const rows = [];
      for (const role of data.role) {
        rows.push(await this.createIfNotExists({ ...data, role }, options));
      }

      return rows;
    }
        
    data = await this.completeReferences(data, options);

    const row = await this.getForAssignableRoleIdAndRoleId(
      data.assignableRoleId,
      data.roleId,
      {
        attributes: ['assignableRoleId', 'roleId'],
        foreign:{
          module:{ attributes:[] },
          assignableRole:{ attributes:[] },
          role:{ attributes:[] },
        },
        skipNoRowsError: true,
        ...options
      }
    );
    if (row) {
      return row;
    }

    return this.create(data);
  }

  /**
   * Gets a assignable role for its assignable role ID and role ID. For many coincidences and for no rows this method fails.
   * @param {integer} assignableRoleId - assignable role ID for the row to get.
   * @param {integer} roleId - role ID for the row to get.
   * @returns {Promise[AssignableRolePerRole]}
   */
  async getForAssignableRoleIdAndRoleId(assignableRoleId, roleId, options) {
    return this.getSingle({
      ...options,
      where: {
        ...options?.where,
        assignableRoleId,
        roleId,
      },
    });
  }

  async getAssignableRolesIdForRoleId(roleId, options) {
    return this.getList({ attributes: ['assignableRoleId'], ...options, where:{ ...options?.where, roleId }});
  }

  async getAssignableRolesIdForRoleName(roleName, options) {
    options = {
      attributes: ['assignableRoleId'],
      ...options,
      include: {
        ...options?.include,
        Role: {
          where: { name: roleName },
          required: false,
          skipAssociationAttributes: true,
        },
      },
    };
        
    const assignableRolePerRole = await this.getList(options);
    const assignableRoleId = assignableRolePerRole.map(a => a.assignableRoleId);

    return assignableRoleId;
  } 
}