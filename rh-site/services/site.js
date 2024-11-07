import { Service } from 'rf-service';
import dependency from 'rf-dependency';

export class SiteService extends Service.IdUuidEnableNameOwnerModuleTranslatable {
  references = {
    users: {
      service: 'userSiteRoleService',
      whereColumn: 'username',
    },
    sessions: 'sessionService',
  };
  viewAttributes = ['uuid', 'name', 'title'];

  init() {
    super.init();
    this.userSiteRoleService = dependency.get('userSiteRoleService');
  }

  async validateForCreation(data) {
    if (!data.title) {
      data.title = data.name[0].toUpperCase() + data.name.slice(1);
    }

    return super.validateForCreation(data);
  }

  /**
   * Gets the site for a given session ID.
   * @param {integer} sessionId - session ID to retrieve the site.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise<Site>}
   */
  async getForSessionId(sessionId, options) {
    return this.getSingleFor({ sessions: { id: sessionId }}, options);
  }

  /**
   * Gets a site list for an user ID.
   * @param {string} userId - 
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]Site]}}
   */
  async getForUserId(userId, options) {
    return this.getSingle(
      {
        ...options,
        include: {
          ...options?.include,
          Session: {
            ...options?.include?.Session,
            where: { id: userId },
          }
        },
      },
      options,
    );
  }

  /**
   * Gets a site list for an user with the username.
   * @param {string} username - 
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]Site]}}
   */
  async getForUsername(username, options) {
    return this.getList(
      {
        ...options,
        users: username,
      },
    );
  }

  /**
   * Gets a site name list for an user with the username.
   * @param {string} username - 
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{[]Site]}}
   */
  async getNameForUsername(username, options) {
    if (!username) {
      return [];
    }

    const sites = await this.getForUsername(username, { ...options, attributes: ['name'], skipThroughAssociationAttributes: true });
    const sitesNames = sites.map(s => s.name);

    return sitesNames;
  }

  async create(data, options) {
    if (!data.users && !data.usersId) {
      return await super.create(data, options);
    }
    data = await this.completeReferences(data, options);
    data = await this.validateForCreation(data);
    const users = data.users ?? data.usersId;

    let transaction;
    if (options?.transaction || this.transaction) {
      if (options.transaction === true || !options.transaction) {
        options.transaction = transaction = await this.createTransaction();
      }
    }
    try {
      const row = await super.create(data, {...options, transaction: options.transaction ?? transaction });
      await Promise.all(users.map(user => this.userSiteRoleService.createIfNotExists({ ...user, siteId: row.id }, { transaction })));
      await await transaction?.commit();
      return row;
    } catch (error) {
      await transaction?.rollback();

      await this.pushError(error);

      throw error;
    }
  }
}