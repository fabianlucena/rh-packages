'use strict';

import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class SourceService {
    /**
     * Creates a new source row into DB.
     * @param {{text: string}} data - data for the new source.
     *  - text: must be unique.
     * @returns {Promise{Source}}
     */
    static async create(data) {
        if (!data.text)
            throw new MissingPropertyError('Source', 'text');

        return conf.global.models.Source.create(data);
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
     * Gets a list of sources.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SourceList}}
     */
    static async getList(options) {
        return conf.global.models.Source.findAll(await SourceService.getListOptions(options));
    }

    /**
     * Gets a source for its text. For many coincidences and for no rows this method fails.
     * @param {string} text - text for the source to get.
     * @param {boolean} isJson - indicates if the text is a object in JSON format.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Source}}
     */
    static getForTextAndIsJson(text, isJson, options) {
        options = {...options, limit: 2};
        options.where = {...options.where, text, isJson: isJson ?? false};
        return this.getList(options)
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['source', 'text', text, 'Source']})));
    }
    
    /**
    * Gets a source ID for its text. For many coincidences and for no rows this method fails.
    * @param {string} text - text for the source to get.
    * * @param {boolean} isJson - indicates if the text is a object in JSON format.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdForTextAndIsJson(text, isJson, options) {
        return (await this.getForTextIsJson(text, isJson, {...options, attributes: ['id']}))?.id;
    }

    /**
     * Creates a new source row into DB if not exists.
     * @param {data} data - data for the new source @see create.
     * @returns {Promise{Source}}
     */
    static createIfNotExists(data, options) {
        data.text = data.text.trim();
        data.isJson ??= false;
        return this.getForTextAndIsJson(data.text, data.isJson, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return this.create(data);
            });
    }

    /**
    * Gets a source ID for its text. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} text - text for the source to get.
    * @param {boolean} isJson - true when the text is a JSON object.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdOrCreateForTextAndIsJson(text, isJson, options) {
        return (await this.createIfNotExists({text, isJson, ref: options?.data?.ref}, {...options, attributes: ['id']})).id;
    }
}