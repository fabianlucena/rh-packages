'use strict';

import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class LanguageService {
    /**
     * Creates a new language row into DB.
     * @param {{name: string, title: string, description: string}} data - data for the new language.
     *  - name: must be unique.
     *  - title: must be unique.
     * @returns {Promise{Language}}
     */
    static async create(data) {
        if (!data.name)
            throw new MissingPropertyError('Language', 'name');

        return conf.global.models.Language.create(data);
    }

    /**
     * Gets a list of languages.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{LanguageList}}
     */
    static getList(options) {
        return conf.global.models.Language.findAll(complete(options, {}));
    }

    /**
     * Gets a language for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the language to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Language}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['language', 'name', name, 'language']})));
    }
    
    /**
    * Gets a Language ID for its name. For many coincidences and for no rows this method fails.
    * @param {string} name - name for the language to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdForName(name, options) {
        return (await this.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Creates a new language row into DB if not exists.
     * @param {data} data - data for the new Language @see create.
     * @returns {Promise{Language}}
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
    * Gets a language ID for its name. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} name - name for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdOrCreateForName(name, options) {
        return (await this.createIfNotExists({name, title: name}, {...options, attributes: ['id']})).id;
    }
}