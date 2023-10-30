import {loc} from 'rf-locale';
import {checkParameterStringNotNullOrEmpty, checkParameterStringUndefinedOrNotNullAndNotEmpty} from 'rf-util';
import {ConflictError} from 'http-util';

export const ServiceMixinTitle = Service => class extends Service {
    searchColumns = ['title'];

    async validateForCreation(data) {
        checkParameterStringNotNullOrEmpty(data?.title, loc._f('Title'));
        this.checkTitleForConflict(data);
        return super.validateForCreation(data.title, data);
    }

    async checkTitleForConflict(title) {
        if (await this.getForTitle(title, {skipNoRowsError: true})) {
            throw new ConflictError(loc._f('Exists another data with that title.'));
        }
    }

    async validateForUpdate(data) {
        checkParameterStringUndefinedOrNotNullAndNotEmpty(data.title, loc._f('Title'));
        if (data.title) {
            this.checkTitleForConflict(data.title, data);
        }

        return super.validateForUpdate(data);
    }

    /**
     * Gets a row for its title. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} title - title for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the title parammeter is a string return a single row or throw an exception.
     * But if the title parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForTitle(title, options) {
        if (title === undefined) {
            throw new Error(loc._f('Invalid value for title to get row'));
        }

        if (Array.isArray(title)) {
            return this.getList({...options, where: {...options?.where, title}});
        }
            
        return this.getSingleFor({title}, options);
    }

    /**
     * Creates a new row into DB if not exists.
     * @param {object} data - data for the row @see create.
     * @param {object} options - options for getForTitle method and for transaction in creation phase.
     * @returns {Promise[row]}
     */
    async createIfNotExists(data, options) {
        const row = await this.getForTitle(data.title, {skipNoRowsError: true, ...options});
        if (row) {
            return row;
        }
            
        return this.create(data, {transacion: options?.transacion});
    }
};