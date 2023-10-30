export const ServiceMixinUuid = Service => class ServiceUuid extends Service {
    /**
     * Gets a row for its UUID. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} uuid - UUID for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForUuid(uuid, options) {
        if (Array.isArray(uuid))
            return this.getList({...options, where: {...options?.where, uuid}});
            
        return this.getSingleFor({uuid}, options);
    }

    /**
     * Updates a row for a given UUID.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the row to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateForUuid(data, uuid, options) {
        return this.updateFor(data, {uuid}, options);
    }

    /**
     * Deletes a rows for a given UUID.
     * @param {string} uuid - UUID for the test case o delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteForUuid(uuid) {
        return this.deleteFor({uuid});
    }
};