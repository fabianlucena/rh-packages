'use strict';

import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class LanguageService {
    /**
     * Complete the data object with the parentId property if not exists. 
     * @param {{parent: string, parentId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeParentId(data) {
        if (!data.parentId && data.parent)
            data.parentId = await LanguageService.getIdForName({name: data.parent});

        return data;
    }
    
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

        await LanguageService.completeParentId(data);

        return conf.global.models.Language.create(data);
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
     * Gets a list of languages.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{LanguageList}}
     */
    static async getList(options) {
        return conf.global.models.Language.findAll(await LanguageService.getListOptions(options));
    }

    /**
     * Gets a language for its ID. For many coincidences and for no rows this method fails.
     * @param {string} id - ID for the language to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Language}}
     */
    static get(id, options) {
        return this.getList(deepComplete(options, {where:{id}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['language', 'id', id, 'language']})));
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
    static async createIfNotExists(data, options) {
        const row = await this.getForName(data.name, {attributes: ['id', 'parentId'], skipNoRowsError: true, ...options});
        if (row)
            return row;

        await LanguageService.completeParentId(data);

        if (!data.parentId) {
            const nameParts = data.name.split('-');
            if (nameParts.length > 1) {
                const parent = await LanguageService.createIfNotExists({name: nameParts[0].trim(), title: nameParts[0].trim()});
                data.parentId = parent.id;
            }
        }

        return this.create(data);
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