import { UserSiteRoleService } from './user_site_role.js';
import { MissingPropertyError, checkDataForMissingProperties } from 'sql-util';
import dependency from 'rf-dependency';

export class UserAccessService extends UserSiteRoleService {
  model = 'userSiteRoleModel';

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

  async completeReferences(data, options) {
    if (data.user?.uuid && !data.userId) {
      data.userId = await this.userService.getSingleIdForUuid(data.user.uuid, options);
    }

    if (data.site?.uuid && !data.siteId) {
      data.siteId = await dependency.get('siteService').getSingleIdForUuid(data.site.uuid, options);
    }

    if (!data.rolesId?.length && data.roles?.length) {
      const rolesId = [];
      for (const role of data.roles) {
        let roleId;
        if (role?.id) {
          roleId = role.id;
        } else if (role?.uuid) {
          roleId = await this.roleService.getSingleIdForUuid(role.uuid, options);
        } else if (typeof role === 'string') {
          roleId = await this.roleService.getSingleIdForUuid(role, options);
        }
        if (roleId) {
          rolesId.push(roleId);
        }
      }

      data.rolesId = rolesId;
      delete data.roles;
    }

    data = await super.completeReferences(data, options);
    return data;
  }

  async validateForCreation(data) {
    if (data.user) {
      await this.userService.validateForCreation(data.user);
    }
        
    await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId');

    if (!data.rolesId?.length) {
      throw new MissingPropertyError('UserAccess', 'roles');
    }
        
    return super.validateForCreation(data);
  }

  async create(data, options) {
    data = await this.completeReferences(data, options);
    data = await this.validateForCreation(data);

    const transaction = await this.createTransaction();
    try {
      let user;
      if (data.userId) {
        user = await this.userService.getSingleOrNullForId(data.userId, { transaction });
      } else {
        user = await this.userService.create(data.user, { transaction });
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
    const queryOptions = {};
    if (options.transaction) {
      queryOptions.transaction = options.transaction;
    }
            
    const rolesId = [];
    for (const roleId of options.rolesId) {
      if (!options.assignableRolesId || options.assignableRolesId.includes(roleId)) {
        rolesId.push(roleId);
        const where = {
          userId: options.userId,
          siteId: options.siteId,
          roleId: roleId,
        };
        const result = await this.userSiteRoleService.getList({ attributes: ['userId'], where: { ...where } });
        if (!result?.length) {
          await this.userSiteRoleService.create({ ...where }, queryOptions);
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

  async getListOptions(options) {
    const rolesInclude = options?.include?.roles ?? options?.include?.role;
    if (!rolesInclude) {
      return super.getListOptions(options);
    }

    const roles = rolesInclude;
    delete options.include.roles;
    delete options.include.role;
    options = await super.getListOptions(options);
    options.include.roles = roles;
    return options;
  }
    
  async getList(options) {
    const rolesInclude = options?.include?.roles ?? options?.include?.role;
    if (!rolesInclude) {
      const result = await super.getList(options);
      if (result) {
        for (const row of result) {
          if (row.user?.uuid && row.site?.uuid) {
            row.uuid = row.user.uuid + ',' + row.site.uuid;
          }
        }
      }
      return result;
    }

    options = { ...options };
    options.view = true;
    options.attributes ??= [];
    options.include ??= {};
    options.include.user ??= {};
    options.include.site ??= {};
    options.include.user.attributes ??= [];
    options.include.site.attributes ??= [];

    if (!options.attributes.includes('userId')) {
      options.attributes.push('userId');
    }

    if (!options.attributes.includes('siteId')) {
      options.attributes.push('siteId');
    }

    if (!options.include.user.attributes.includes('uuid')) {
      options.include.user.attributes.push('uuid');
    }

    if (!options.include.site.attributes.includes('uuid')) {
      options.include.site.attributes.push('uuid');
    }

    const rolesOptions = rolesInclude;
    delete options.include.roles;
    delete options.include.role;
    options = await this.getListOptions(options);
    const result = await super.getList(options);

    const roleQueryOptions = {
      view: true,
      include: {
        user: { attributes: [] },
        site: { attributes: [] },
        role: rolesOptions,
      },
      attributes: ['isEnabled'],
      where: {
        user: {},
        site: {},
      },
      loc: options.loc,
    };

    if (options.include?.role?.id) {
      roleQueryOptions.where = { role: { id: options.include.role.id }};
    }

    for (const row of result) {
      if (row.user?.uuid && row.site?.uuid) {
        row.uuid = row.user.uuid + ',' + row.site.uuid;
      }

      roleQueryOptions.where.user.id = row.userId;
      roleQueryOptions.where.site.id = row.siteId;

      const userSiteRoles = await this.getList(roleQueryOptions);
      row.roles = userSiteRoles.map(userSiteRole => {return { ...userSiteRole.role, isEnabled: userSiteRole.isEnabled };});
            
      delete row.userId;
      delete row.siteId;
    }
    
    return result;
  }

  async update(data, options) {
    data = await this.completeReferences(data, options);
    if (options?.where) {
      options = { ...options }; 
      options.where = await this.completeReferences(options.where);
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