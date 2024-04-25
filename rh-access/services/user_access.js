import { UserSiteRoleService } from './user_site_role.js';
import { MissingPropertyError, checkDataForMissingProperties } from 'sql-util';
import dependency from 'rf-dependency';

export class UserAccessService extends UserSiteRoleService {
  init () {
    super.init();

    this.userService = dependency.get('userService');
    this.roleService = dependency.get('roleService');
    this.userSiteRoleService = dependency.get('userSiteRoleService');
  }

  async validateRoleId(roleId, data) {
    if (!roleId && !data.rolesId) {
      throw new MissingPropertyError('UserSiteRole', 'roleId');
    }
  }

  async completeReferences(data, clean) {
    data = await super.completeReferences(data, clean);

    if (!data.rolesId?.length && data.rolesUuid?.length) {
      data.rolesId = await this.roleService.getIdForUuid(data.rolesUuid);
    }
  }

  async validateForCreation(data) {
    if (data.User) {
      await this.userService.validateForCreation(data.User);
    }
        
    await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId');

    if (!data.rolesId?.length) {
      throw new MissingPropertyError('UserAccess', 'roles');
    }
        
    return super.validateForCreation(data);
  }

  async create(data) {
    await this.completeReferences(data, true);
    await this.validateForCreation(data);

    const transaction = await this.createTransaction();
    try {
      let user;
      if (data.userId) {
        user = await this.userService.getForId(data.userId, { transaction });
      } else if (data.userUuid) {
        user = await this.userService.getForUuid(data.userUuid, { transaction });
      } else {
        user = await this.userService.create(data.User, { transaction });
      }
            
      if (!data.rolesId?.length && data.rolesUuid?.length) {
        data.rolesId = await this.roleService.getIdForUuid(data.rolesUuid);
      }

      user.rolesId = await this.updateRoles({
        userId: user.id,
        siteId: data.siteId,
        rolesId: data.rolesId,
        assignableRolesId: data.assignableRolesId,
        transaction: transaction,
      });

      await transaction.commit();

      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateRoles(options) {
    const getListOptions = {
      attributes: ['userId'],
      where: {
        userId: options.userId,
        siteId: options.siteId,
      }
    };
    const queryOptions = {};
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }
            
    const rolesId = [];
    for (const roleId of options.rolesId) {
      if (!options.assignableRolesId || options.assignableRolesId.includes(roleId)) {
        rolesId.push(roleId);
        getListOptions.where.roleId = roleId;
        const result = await this.userSiteRoleService.getList(getListOptions);
        if (!result?.length) {
          await this.userSiteRoleService.create(getListOptions.where, queryOptions);
        }
      }
    }

    const deleteData = {
      userId: options.userId,
      siteId: options.siteId,
    };
    if (options.assignableRolesId) {
      deleteData.roleId = options.assignableRolesId;
    }

    deleteData.notRoleId = options.rolesId;
    await this.userSiteRoleService.deleteFor(deleteData, queryOptions);

    return rolesId;
  }
    
  async getList(options) {
    if (!options?.include?.roles) {
      return super.getList(options);
    }

    options = { ...options };
    options.view = true;
    options.attributes ??= [];
    if (!options.attributes.includes('userId')) {
      options.attributes.push('userId');
    }

    if (!options.attributes.includes('siteId')) {
      options.attributes.push('siteId');
    }
    
    options.include = {
      User: { attributes: ['uuid'] },
      Site: { attributes: ['uuid'] },
      ...options.include,
    };

    options = await this.getListOptions(options);

    const result = await super.getList(options);

    const roleQueryOptions = {
      view: true,
      include: {
        User: { attributes: [] },
        Site: { attributes: [] },
        Role: {},
      },
      attributes: ['isEnabled'],
      where: {},
      loc: options.loc,
    };

    if (options.include.RolesId) {
      roleQueryOptions.where = { roleId: options.include.RolesId };
    }

    for (const row of result) {
      row.uuid = row.User.uuid + ',' + row.Site.uuid;

      roleQueryOptions.where.userId = row.userId;
      roleQueryOptions.where.siteId = row.siteId;

      const userSiteRoles = await this.getList(roleQueryOptions);
      row.roles = userSiteRoles.map(userSiteRole => {return { ...userSiteRole.Role, isEnabled: userSiteRole.isEnabled };});
            
      delete row.userId;
      delete row.siteId;
    }
    
    return result;
  }

  async update(data, options) {
    await this.completeReferences(data);
    if (options?.where) {
      await this.completeReferences(options.where);
    }

    const userId = options?.where?.userId ?? data?.userId;
    const siteId = options?.where?.siteId ?? data?.siteId;
        
    await checkDataForMissingProperties({ userId, siteId }, 'UserAccess', 'userId', 'siteId');

    options ??= {};

    let transaction;
    if (options.transaction !== true) {
      options.transaction = transaction = await this.createTransaction();
    }

    try {
      const transactionOptions = { transaction: options.transaction };
      if (data.User) {
        await this.userService.update(
          {
            ...data.User,
            id: undefined,
            uuid: undefined,
          },
          {
            ...transactionOptions,
            where: { id: userId },
          }
        );
      }

      let result;
      if (data.rolesId)
        result = await this.updateRoles({
          userId,
          siteId,
          rolesId: data.rolesId,
          assignableRolesId: data.assignableRolesId,
          transaction: transaction,
        });

      if (data.isEnabled !== undefined)
        result = await super.update(
          { isEnabled: data.isEnabled },
          {
            ...transactionOptions,
            where: { userId, siteId }
          }
        );

      await transaction?.commit();

      return result;
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }
}