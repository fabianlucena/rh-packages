'use strict';

import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

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
     * Gets a list of sources.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{SourceList}}
     */
    static getList(options) {
        return conf.global.models.Source.findAll(complete(options, {}));
    }

    /**
     * Gets a source for its text. For many coincidences and for no rows this method fails.
     * @param {string} text - text for the source to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Source}}
     */
    static getForText(text, options) {
        return this.getList(deepComplete(options, {where:{text}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['source', 'text', text, 'Source']})));
    }
    
    /**
    * Gets a source ID for its text. For many coincidences and for no rows this method fails.
    * @param {string} text - text for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdForText(text, options) {
        return (await this.getForText(text, {...options, attributes: ['id']}))?.id;
    }

    /**
     * Creates a new source row into DB if not exists.
     * @param {data} data - data for the new source @see create.
     * @returns {Promise{Source}}
     */
    static createIfNotExists(data, options) {
        return this.getForText(data.text, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return this.create(data);
            });
    }

    /**
    * Gets a source ID for its text. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} text - text for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{ID}}
    */
    static async getIdOrCreateForText(text, options) {
        return (await this.createIfNotExists({text, isJson: options?.data?.isJson, ref: options?.data?.ref}, {...options, attributes: ['id']})).id;
    }
}