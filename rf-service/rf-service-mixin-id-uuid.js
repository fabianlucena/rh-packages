export const ServiceMixinIdUuid = Service => class ServiceIdUUID extends Service {
  /**
   * Gets a row ID for its UUID. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} uuid - UUID for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {ID}
   * 
   * If the uuid parammeter is a string return a single ID or throw an exception.
   * But if the name parameter is a array can return a ID list.
   * 
   * This function uses @ref getForUUID function so the options for getForUUID
   * function can be specified.
   */
  async getIdForUuid(uuid, options) {
    if (Array.isArray(uuid)) {
      return (await this.getForUuid(uuid, { attributes: ['id'], ...options })).map(row => row.id);
    }
        
    return (await this.getForUuid(uuid, { attributes: ['id'], ...options })).id;
  }

  async getIdOrNullForUuid(uuid, options) {
    return this.getIdForUuid(
      uuid,
      {
        ...options,
        skipNoRowsError: true,
        nullOnManyRowsError: true,
      },
    );
  }

  async getSingleOrNullForUuid(uuid, options) {
    return this.getForUuid(
      uuid,
      {
        ...options,
        skipNoRowsError: true,
        nullOnManyRowsError: true,
      },
    );
  }
};