import { conf } from '../conf.js';
import { ServiceEnabledOwnerModuleTranslatable } from 'rf-service';
import { MissingPropertyError, checkDataForMissingProperties } from 'sql-util';
import dependency from 'rf-dependency';

export class UserSiteRoleService extends ServiceEnabledOwnerModuleTranslatable {
  references = {
    user: {
      getIdForName: 'getIdForUsername',
      otherName: 'username',
      attributes: ['uuid', 'username', 'displayName', 'isTranslatable', 'isEnabled'],
    },
    site: {
      createIfNotExists: true,
      attributes: ['uuid', 'name', 'title', 'isTranslatable', 'isEnabled'],
    },
    role: {
      attributes: ['uuid', 'name', 'title', 'isTranslatable', 'isEnabled'],
    },
  };
  viewAttributes = ['isEnabled'];

  init() {
    if (!dependency.get('siteService', null))  {
      throw new Error('There is no Site service. Try adding RH Site module to the project.');
    }
        
    super.init();
  }

  async validateUserId(userId) {
    if (!userId) {
      throw new MissingPropertyError('UserSiteRole', 'userId');
    }
  }

  async validateSiteId(siteId) {
    if (!siteId) {
      throw new MissingPropertyError('UserSiteRole', 'siteId');
    }
  }

  async validateRoleId(roleId) {
    if (!roleId) {
      throw new MissingPropertyError('UserSiteRole', 'roleId');
    }
  }

  async validateForCreation(data) {
    await this.validateUserId(data.userId, data);
    await this.validateSiteId(data.siteId, data);
    await this.validateRoleId(data.roleId, data);

    return super.validateForCreation(data);
  }

  async getListOptions(options) {
    if (options.where?.userUuid) {
      throw new Error('options.where.userUuid is obsolete in UserSiteRoleService.');
    }

    if (options.where?.roleUuid) {
      throw new Error('options.where.roleUuid is obsolete in UserSiteRoleService.');
    }

    if (options.where?.siteUuid) {
      throw new Error('options.where.siteUuid is obsolete in UserSiteRoleService.');
    }
       
    options = { ...options };

    if (!options.include.Role && !options.where?.user) {
      let autoGroup = [];

      if (!options.attributes.includes('userId')) {
        autoGroup.push('userSiteRole.userId');
      }

      options.attributes.forEach(column => autoGroup.push('userSiteRole.' + column));

      if (options.include?.User || options.where?.user?.uuid) {
        if (!options.include.user.attributes.includes('id')) {
          autoGroup.push('user.id');
        }

        options.include.user.attributes.forEach(
          column => autoGroup.push('user.' + column)
        );
      }

      if (options.include?.Site || options.where?.site?.uuid) {
        if (!options.include.site.attributes.includes('id')) {
          autoGroup.push('site.id');
        }
                
        options.include.site.attributes.forEach(
          column => autoGroup.push('site.' + column)
        );
      }

      if (autoGroup?.length) {
        options.groupBy = [...new Set((options.groupBy ?? []).concat(autoGroup))];
      }
    }
        
    if (!options.orderBy && options.include.user) {
      options.orderBy ??= [];
      options.orderBy.push(['user.username', 'ASC']);
    }

    return super.getListOptions(options);
  }

  async getUserIdForUserUuid(uuid, options) {
    const userSiteRole = await this.getSingleFor({ userUuid: uuid }, { ...options, limit: 1 });
    return userSiteRole?.userId;
  }

  /**
   * Enables a row for a given site ID and user ID.
   * @param {string} siteId - ID for the site to enable.
   * @param {string} userId - ID for the user to enable.
   * @returns {Promise[integer]} enabled rows count.
   */
  async enableForSiteIdAndUserId(siteId, userId, options) {
    return await this.updateFor({ isEnabled: true }, { siteId, userId }, options);
  }

  /**
   * Disables a row for a given site ID and user ID.
   * @param {string} siteId - ID for the site to disable.
   * @param {string} userId - ID for the user to disable.
   * @returns {Promise[integer]} disabled rows count.
   */
  async disableForSiteIdAndUserId(siteId, userId, options) {
    return await this.updateFor({ isEnabled: false }, { siteId, userId }, options);
  }

  /**
   * Creates a new UserSiteRole row into DB if not exists.
   * @param {data} data - data for the new UserSiteRole.
   * @returns {Promise{UserSiteRole}}
   */
  async createIfNotExists(data, options) {
    await this.completeReferences(data);
    await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId', 'roleId');

    const rows = await this.getList({
      ...options,
      attributes: ['userId', 'siteId', 'roleId'],
      where: {
        ...options?.where,
        userId: data.userId,
        siteId: data.siteId,
        roleId: data.roleId,
      },
      include: [],
      limit: 1
    });
    if (rows?.length) {
      return rows[0];
    }

    return this.create(data);
  }

  async delete(options) {
    await this.completeReferences(options.where, true);

    const where = options.where;
    if (where?.notRoleId) {
      const Op = conf.global.Sequelize.Op;
      const condition = { [Op.notIn]: where.notRoleId };
      if (where.roleId) {
        where.roleId = { [Op.and]: [where.roleId, condition] };
      } else {
        where.roleId = condition;
      }

      delete where.notRoleId;
    }

    return this.model.destroy(options);
  }
}