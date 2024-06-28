import { conf } from '../conf.js';
import { ServiceBase } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class SessionSiteService extends ServiceBase {
  sequelize = conf.global.sequelize;
  model = conf.global.models.SessionSite;
  references = {
    session: conf.global.services.Session.singleton(),
    site: conf.global.services.Site.singleton(),
  };
  defaultTranslationContext = 'sessionSite';

  /**
     * Creates a new SessionSite row into DB.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'SessionSite', 'sessionId', 'siteId');
    return super.validateForCreation(data);
  }

  /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
  async getListOptions(options) {
    options ??= {};
    if (!options.includes) {
      options.include = [];
      options.include.push({
        model: conf.global.models.Site,
        where: { isEnabled: options.foreign?.site?.where.isEnabled ?? true },
        attributes: options.foreign?.site?.attributes,
      });
    }

    return super.getListOptions(options);
  }

  /**
     * Updates a existent SessionSite row into DB, for the siteId property.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
  async updateSite(data) {
    await this.completeReferences(data);
    return this.updateFor({ siteId: data.siteId }, { sessionId: data.sessionId });
  }

  /**
     * Creates a new SessionSite row into DB or update the siteId property if exists.
     * @param {{
     *  sessionId: integer,
     *  siteId: integer,
     * }} data - data for the new SessionSite.
     * @returns {Promise{SessionSite}}
     */
  async createOrUpdate(data) {
    await this.completeReferences(data);
        
    const where = { sessionId: data.sessionId };
    const rows = await this.getList({ where });
    if (rows?.length) {
      return this.updateFor({ siteId: data.siteId }, where);
    }

    return this.create(data);
  }
}