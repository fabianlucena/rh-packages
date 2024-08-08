import { CheckError, InvalidValueError } from './rf-service-errors.js';

export const ServiceMixinId = Service => class ServiceId extends Service {
  init() {
    if (!this.hiddenColumns.includes('id')) {
      this.hiddenColumns.push('id');
    }

    super.init();
  }

  async validateForCreation(data) {
    await this.checkIdForCreation(data.id, data);
    return super.validateForCreation(data);
  }

  async checkIdForCreation(id) {
    if (id) {
      throw new CheckError(loc => loc._c('service', 'ID parameter is forbidden for creation.'));
    }
  }

  async validateForUpdate(data, where) {
    if (data?.id) {
      throw new CheckError(loc => loc._c('service', 'ID parameter is forbidden for update.'));
    }

    return super.validateForUpdate(data, where);
  }

  /**
   * Gets a row for its ID. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} id - ID for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   * 
   * If the name parameter is a string return a single row or throw an exception.
   * But if the name parameter is a array can return a row list.
   * 
   * This function uses @ref getSingle function so the options for getSingle
   * function can be specified.
   */
  async getForId(id, options) {
    if (id === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for ID to get row in %s.'));
    }

    return this.getList({ ...options, where: { ...options?.where, id }});
  }

  async getSingleForId(id, options) {
    if (id === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for ID to get row in %s.'));
    }

    return this.getSingle({ ...options, where: { ...options?.where, id }});
  }

  async getSingleOrNullForId(id, options) {
    if (id === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for ID to get row in %s.'));
    }
    
    return this.getSingleForId(id, { skipNoRowsError: true, ...options });
  }

  /**
   * Gets a row ID list for a given criteria.
   * @param {object} where - criteria to get the row list.
   * @param {object} options - Options for the @ref getList function.
   * @returns {Promise[Array[ID]]}
   * 
   * This function uses @ref getFor function so the options for getFor
   * function can be specified.
   */
  async getIdFor(where, options) {
    return (await this.getFor(where, { attributes: ['id'], ...options })).map(row => row.id);
  }

  async update(data, options) {
    if (!options?.where && data.id) {
      options ??= {};
      options.where = { id: data.id };
      data = { ...data, id: undefined };
    }

    return super.update(data, options);
  }

  /**
   * Updates a row for a given ID.
   * @param {object} data - Data to update.
   * @param {object} id - ID of the row to update.
   * @returns {Promise[integer]} updated rows count.
   */
  async updateForId(data, id, options) {
    return this.updateFor(data, { id }, options);
  }

  /**
   * Deletes a rows for a given ID.
   * @param {string} id - ID for the test case o delete.
   * @returns {Promise[integer]} deleted rows count.
   */
  async deleteForId(id) {
    return this.deleteFor({ id });
  }
};