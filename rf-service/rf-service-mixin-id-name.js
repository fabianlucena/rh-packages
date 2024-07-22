export const ServiceMixinIdName = Service => class ServiceIdName extends Service {
  /**
   * Gets a row ID for its name. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} name - name for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {ID}
   * 
   * If the name parameter is a string return a single ID or throw an exception.
   * But if the name parameter is a array can return a ID list.
   * 
   * This function uses @ref getForName function so the options for getForName
   * function can be specified.
   */
  async getIdForName(name, options) {
    return (await this.getForName(name, { attributes: ['id'], ...options })).map(row => row.id);
  }

  async getSingleIdForName(name, options) {
    return (await this.getSingleForName(name, { attributes: ['id'], ...options })).id;
  }

  async getIdOrNullForName(name, options) {
    return (await this.getSingleOrNullForName(name, { attributes: ['id'], ...options }))?.id;
  }

  async getNameForId(id, options) {
    return (await this.getForId(id, { attributes: ['name'], ...options })).map(row => row.name);
  }
        
  async getSingleNameForId(id, options) {
    return (await this.getSingleForId(id, { attributes: ['name'], ...options })).name;
  }

  /**
   * Gets a row ID for its name. For many coincidences this method fails, for no rows this method will creates a new one.
   * @param {string} name - name for the source to get.
   * @param {Options} options - Options for the @ref getList method.
   * @returns {Promise[ID]}
   */
  async getIdOrCreateForName(name, options) {
    if (!Array.isArray(name)) {
      name = [ name ];
    }

    const ids = [];
    for (const thisName of name) {
      const [ row ] = await this.findOrCreate({ name: thisName, title: thisName }, { ...options, attributes: ['id'] });
      ids.push(row.id);
    }

    return ids;
  }
};