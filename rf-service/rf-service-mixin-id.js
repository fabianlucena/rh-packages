'use strict';

export const ServiceMixinId = Service => class ServiceId extends Service {
    /**
     * Gets a row for its ID. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} id - ID for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForId(id, options) {
        if (Array.isArray(id))
            return this.getList({...options, where: {...options?.where, id}});
            
        const rows = await this.getList({limit: 2, ...options, where: {...options?.where, id}});

        return this.getSingleFromRows(rows, options);
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
        return (await this.getFor(where, {attributes: ['id'], ...options})).map(row => row.id);
    }

    /**
     * Updates a row for a given ID.
     * @param {object} data - Data to update.
     * @param {object} id - ID of the row to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateForId(data, id, options) {
        return this.updateFor(data, {id}, options);
    }

    /**
     * Deletes a rows for a given ID.
     * @param {string} id - ID for the test case o delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteForId(id) {
        return this.deleteFor({id});
    }
};