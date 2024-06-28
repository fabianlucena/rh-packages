import { conf } from '../conf.js';
import { ServiceModuleTranslatable } from 'rf-service';
import { MissingPropertyError, addEnabledOwnerModuleFilter, checkDataForMissingProperties, completeIncludeOptions, getIncludedModelOptions } from 'sql-util';
import dependency from 'rf-dependency';

export class UserSiteRoleService extends ServiceModuleTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.UserSiteRole;
  references = {
    user: {
      getIdForName: 'getIdForUsername',
      otherName: 'username',
    },
    site: {
      createIfNotExists: true,
    },
    role: true,
  };
  defaultTranslationContext = 'userSiteRole';

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
    if (options.isEnabled !== undefined) {
      options = addEnabledOwnerModuleFilter(options, conf.global.models.Module);
      options.where ??= {};
      options.where.isEnabled = options.isEnabled;
    }

    if (!options.attributes) {
      if (options.view) {
        options.attributes = ['isEnabled'];
      }
    }
        
    let autoGroup;
    if (options.includeRole || options.where?.userUuid) {
      const attributes = options.includeRole?.attributes ??
                options.includeRole?
        ['uuid', 'name', 'title', 'isTranslatable', 'isEnabled']:
        [];
            
      let where;
      if (options.where?.roleUuid) {
        where = { uuid: options.where.roleUuid };
        delete options.where.roleUuid;
      }

      completeIncludeOptions(
        options,
        'Role',
        options.includeRole,
        {
          model: conf.global.models.Role,
          attributes,
          where,
        }
      );

      delete options.includeRole;
    } else if (!getIncludedModelOptions(options, conf.global.models.Role)) {
      autoGroup = [];
    }

    if (autoGroup) {
      if (!options.attributes.includes('userId')) {
        autoGroup.push('UserSiteRole.userId');
      }

      options.attributes.forEach(column => autoGroup.push('UserSiteRole.' + column));
    }

    if (options.includeUser || options.where?.userUuid) {
      const attributes = options.includeUser?.attributes ??
                options.includeUser?
        ['uuid', 'username', 'displayName', 'isTranslatable', 'isEnabled']:
        [];
            
      let where;
      if (options.where?.userUuid) {
        where = { uuid: options.where.userUuid };
        delete options.where.userUuid;
      }

      completeIncludeOptions(
        options,
        'User',
        options.includeUser,
        {
          model: conf.global.models.User,
          attributes,
          where,
        }
      );

      delete options.includeUser;

      if (autoGroup) {
        if (!attributes.includes('id')) {
          autoGroup.push('User.id');
        }

        attributes.forEach(column => autoGroup.push('User.' + column));
      }
    }

    if (options.includeSite || options.where?.siteUuid) {
      const attributes = options.includeUser?.attributes ??
                options.includeSite?
        ['uuid', 'name', 'title', 'isTranslatable']:
        [];
                
      let where;
      if (options.where?.siteUuid) {
        where = { uuid: options.where.siteUuid };
        delete options.where.siteUuid;
      }

      completeIncludeOptions(
        options,
        'Site',
        options.includeSite,
        {
          model: conf.global.models.Site,
          attributes,
          where,
        }
      );

      delete options.includeSite;

      if (autoGroup) {
        if (!attributes.includes('id')) {
          autoGroup.push('Site.id');
        }
                
        attributes.forEach(column => autoGroup.push('Site.' + column));
      }
    }

    if (autoGroup?.length) {
      options.group = [...new Set((options.group ?? []).concat(autoGroup))];
    }
        
    if (!options.orderBy && getIncludedModelOptions(options, conf.global.models.User)) {
      options.orderBy ??= [];
      options.orderBy.push(['User.username', 'ASC']);
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