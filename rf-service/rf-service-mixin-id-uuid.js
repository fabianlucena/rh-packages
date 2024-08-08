export const ServiceMixinIdUuid = Service => class ServiceIdUUID extends Service {
  /**
   * Gets a row ID for its UUID. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} uuid - UUID for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {ID}
   * 
   * If the uuid parameter is a string return a single ID or throw an exception.
   * But if the name parameter is a array can return a ID list.
   * 
   * This function uses @ref getForUUID function so the options for getForUUID
   * function can be specified.
   */
  async getIdForUuid(uuid, options) {
    return (await this.getForUuid(uuid, { attributes: ['id'], ...options })).map(row => row.id);
  }

  async getSingleIdForUuid(uuid, options) {
    return (await this.getSingleForUuid(uuid, { attributes: ['id'], ...options })).id;
  }

  async getIdOrNullForUuid(uuid, options) {
    return (await this.getSingleOrNullForUuid(uuid, { attributes: ['id'], ...options }))?.id;
  }
};