export const ServiceMixinIdName = Service => class ServiceIdName extends Service {
  /**
     * Gets a row ID for its name. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} name - name for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {ID}
     * 
     * If the name parammeter is a string return a single ID or throw an exception.
     * But if the name parameter is a array can return a ID list.
     * 
     * This function uses @ref getForName function so the options for getForName
     * function can be specified.
     */
  async getIdForName(name, options) {
    if (Array.isArray(name)) {
      return (await this.getForName(name, { attributes: ['id'], ...options })).map(row => row.id);
    }
        
    const row = await this.getForName(name, { attributes: ['id'], ...options });
    if (!row) {
      return;
    }

    return row.id;
  }

  async getNameForId(id, options) {
    if (Array.isArray(id)) {
      return (await this.getForId(id, { attributes: ['name'], ...options })).map(row => row.name);
    }
        
    const row = await this.getForId(id, { attributes: ['name'], ...options });
    if (!row) {
      return;
    }

    return row.name;
  }

  /**
    * Gets a row ID for its name. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} name - name for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise[ID]}
    */
  async getIdOrCreateForName(name, options) {
    if (Array.isArray(name)) {
      const ids = [];
      for (const thisName of name)
        ids.push((await this.createIfNotExists({ name: thisName, title: thisName }, { ...options, attributes: ['id'] })).id);

      return ids;
    }
    else
      return (await this.createIfNotExists({ name, title: name }, { ...options, attributes: ['id'] })).id;
  }
};