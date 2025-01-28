import { Service } from 'rf-service';
import { MissingPropertyError } from 'sql-util';

export class SourceService extends Service.IdUuidEnable {
  async sanitizeText(text) {
    return text.trim().replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  }

  async unsanitizeText(text) {
    return text.trim().replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  }
    
  async validateForCreation(data) {
    if (typeof data.text === 'undefined' || data.text === null) {
      throw new MissingPropertyError('Source', 'text');
    }

    data.text = await this.sanitizeText(data.text);

    return super.validateForCreation(data);
  }

  async getListOptions(options) {
    if (options.where?.text) {
      options.where.text = await this.sanitizeText(options.where.text);
    }

    return await super.getListOptions(options);
  }

  /**
   * Gets a source for its text. For many coincidences returns the first ocurrence and for no rows this method fails.
   * @param {string} text - text for the source to get.
   * @param {boolean} isJson - indicates if the text is a object in JSON format.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise{Source}}
   */
  async getForTextAndIsJson(text, isJson, options) {
    const rows = await this.getList({ where: { text, isJson: isJson ?? false, ...options?.where }, limit: 1, ...options });
    if (!rows?.length) {
      return;
    }

    return rows[0];
  }
    
  /**
    * Gets a source ID for its text. For many coincidences and for no rows this method fails.
    * @param {string} text - text for the source to get.
    * @param {boolean} isJson - indicates if the text is a object in JSON format.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
  async getIdForTextAndIsJson(text, isJson, options) {
    return (await this.getForTextIsJson(text, isJson, { ...options, attributes: ['id'] }))?.id;
  }

  /**
   * Creates a new source row into DB if not exists.
   * @param {data} data - data for the new source @see create.
   * @returns {Promise{Source}}
   */
  async createIfNotExists(data, options) {
    data.text = data.text.trim();
    data.isJson ??= false;
    const row = await this.getForTextAndIsJson(data.text, data.isJson, { attributes: ['id'], skipNoRowsError: true, ...options });
    if (row) {
      return row;
    }

    return this.create(data);
  }

  /**
    * Gets a source ID for its text. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} text - text for the source to get.
    * @param {boolean} isJson - true when the text is a JSON object.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
  async getIdOrCreateForTextAndIsJson(text, isJson, options) {
    return (await this.createIfNotExists({ text, isJson, ref: options?.data?.ref }, { ...options, attributes: ['id'] })).id;
  }
}