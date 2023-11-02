import {CheckError, checkParameterStringNotNullOrEmpty, trim} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export const ServiceMixinName = Service => class extends Service {
    searchColumns = ['name'];

    async validateForCreation(data) {
        checkParameterStringNotNullOrEmpty(trim(data?.name), loc._f('Name'));
        await this.checkNameForConflict(data.name, data);
        return super.validateForCreation(data);
    }

    async checkNameForConflict(name) {
        const rows = await this.getFor({name}, {limit: 1});
        if (rows?.length) {
            throw new ConflictError(loc._f('Exists another row with that name.'));
        }
    }

    async validateForUpdate(data) {
        if (data.name) {
            throw new CheckError(loc._f('Name parameter is forbidden for update.'));
        }

        return super.validateForUpdate(data);
    }

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
        if (name === undefined) {
            throw new Error(loc._f('Invalid value for name to get row'));
        }

        if (Array.isArray(name)) {
            return this.getList({...options, where: {...options?.where, name}});
        }
            
        return this.getSingleFor({name}, options);
    }

    /**
     * Creates a new row into DB if not exists.
     * @param {object} data - data for the row @see create.
     * @param {object} options - options for getForName method and for transaction in creation phase.
     * @returns {Promise[row]}
     */
    async createIfNotExists(data, options) {
        const row = await this.getForName(data.name, {skipNoRowsError: true, ...options});
        if (row) {
            return row;
        }
            
        return this.create(data, {transacion: options?.transacion});
    }
};