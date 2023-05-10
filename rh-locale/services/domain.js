'use strict';

import {conf} from '../conf.js';
import {checkDataForMissingProperties, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class DomainService {
    /**
     * Creates a new domain row into DB.
     * @param {{name: string, title: string, description: string}} data - data for the new domain.
     *  - name: must be unique.
     *  - title: must be unique.
     * @returns {Promise{Domain}}
     */
    static async create(data) {
        await checkDataForMissingProperties(data, 'Domain', 'name', 'title');

        return conf.global.models.Domain.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (!options)
            options = {};

        return options;
    }

    /**
     * Gets a list of domains.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{DomainList}}
     */
    static async getList(options) {
        return conf.global.models.Domain.findAll(await DomainService.getListOptions(options));
    }

    /**
     * Gets a domain for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the domain to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Domain}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['domain', 'name', name, 'Domain']})));
    }
    
    /**
    * Gets a domain ID for its name. For many coincidences and for no rows this method fails.
    * @param {string} name - name for the domain to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdForName(name, options) {
        return (await this.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Creates a new domain row into DB if not exists.
     * @param {data} data - data for the new domain @see create.
     * @returns {Promise{Domain}}
     */
    static createIfNotExists(data, options) {
        return this.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return this.create(data);
            });
    }

    /**
    * Gets a domain ID for its name. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} name - name for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdOrCreateForName(name, options) {
        return (await this.createIfNotExists({name, title: name}, {...options, attributes: ['id']})).id;
    }
}