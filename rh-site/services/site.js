import { ServiceIdUuidNameEnabledOwnerModuleTranslatable } from 'rf-service';

export class SiteService extends ServiceIdUuidNameEnabledOwnerModuleTranslatable {
  references = {
    users: {
      service: 'userService',
      whereColumn: 'username',
    },
    sessions: 'sessionService',
  };
  viewAttributes = ['uuid', 'name', 'title'];

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
}