'use strict';

import {loc} from 'rf-locale';

export const ServiceMixinName = Service => class extends Service {
    /**
     * Gets a row for its name. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} name - name for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForName(name, options) {
        if (name === undefined)
            throw new Error(loc._f('Invalid value for name to get row'));

        if (Array.isArray(name))
            return this.getList({...options, where: {...options?.where, name}});
            
        return this.getSingleFor({name}, options);
    }
};