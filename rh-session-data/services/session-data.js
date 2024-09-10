import { Service } from 'rf-service';
import { checkDataForMissingProperties, getSingle } from 'sql-util';
import { deepMerge } from 'rf-util';

export class SessionDataService extends Service.Base {
  references = {
    session: true,
  };
  defaultTranslationContext = 'session';

  async completeJsonData(data) {
    if (!data.jsonData && data.data) {
      data.jsonData = JSON.stringify(data.data);
    }

    return data;
  }

  async validateForCreation(data) {
    await this.completeJsonData(data);
    await checkDataForMissingProperties(data, 'SessionData', 'sessionId', 'jsonData');

    return super.validateForCreation(data);
  }

  async validateForUpdate(data) {
    await this.completeJsonData(data);
    await checkDataForMissingProperties(data, 'SessionData', 'jsonData');

    return super.validateForUpdate(data);
  }

  /**
   * Gets a list of session data.
   * @param {Options} options - options for the @see sequelize.findAll method.
   * @returns {Promise{ProjectList}}
   */
  async getForSessionId(sessionId, options) {
    const rows = await this.getList({ ...options, where: { ...options?.where, sessionId }, limit: 2 });
    return getSingle(
      rows,
      {
        ...options,
        params: [
          'SessionData',
          loc => loc._c('sessionData', 'Session ID = %s', sessionId),
          'SessionData'
        ],
      },
    );
  }

  /**
   * Get data for a session.
   * @param {string} sessionId - Session ID to retrieve the data.
   * @returns {Promise[Site]}
   */
  async getDataForSessionId(sessionId, options) {
    return (await this.getForSessionId(sessionId, options)).data;
  }

  async getDataOrNullForSessionId(sessionId, options) {
    return (await this.getForSessionId(sessionId, { ...options, skipNoRowsError: true }))?.data;
  }

  async updateForSessionId(data, sessionId) {
    return this.updateFor(data, { sessionId });
  }

  async updateForSessionIdOrCreate(sessionId, data) {
    const rows = await this.getList({ where: { ...data?.where, sessionId }, limit: 1 });
    if (rows?.length) {
      return this.updateForSessionId({ data }, sessionId);
    }
        
    return this.create({ data, sessionId });
  }

  /**
   * Add data to a session.
   * @param {string} sessionId - Session ID to which add the data.
   * @param {object} sessionData - Data to add or replace.
   * @returns {Promise[Site]}
   */
  async addData(sessionId, sessionData) {
    const mergedData = deepMerge(
      await this.getDataOrNullForSessionId(sessionId) ?? {},
      sessionData
    );

    return this.setData(sessionId, mergedData);
  }
    
  /**
    * Set the data to a session, warning previous data will be erased..
    * @param {string} sessionId - Session ID to which add the data.
    * @param {object} sessionData - Data to add or replace.
    * @returns {Promise[Site]}
    */
  async setData(sessionId, sessionData) {
    return this.updateForSessionIdOrCreate(sessionId, sessionData);
  }
}