import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class SessionSiteService extends Service.Base {
  references = {
    Session: true,
    Site: true,
  };

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
   * Creates a new SessionSite row into DB or update the siteId property if exists.
   * @param {{
   *  sessionId: integer,
   *  siteId: integer,
   * }} data - data for the new SessionSite.
   * @returns {Promise{SessionSite}}
   */
  async createOrUpdate(data) {
    data = await this.completeReferences(data);
        
    const where = { sessionId: data.sessionId };
    const rows = await this.getList({ where });
    if (rows?.length) {
      return this.updateFor({ siteId: data.siteId }, where);
    }

    return this.create(data);
  }
}