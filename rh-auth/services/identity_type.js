import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class IdentityTypeService {
    /**
     * Creates a new IdentityType row into DB.
     * @param {{name: string, title: {string}} data - data for the new IdentityType.
     *  - name: must be unique.
     * @returns {Promise{IdentityType}}
     */
    static async create(data) {
        if (!data.name)
            throw new MissingPropertyError('IdentityType', 'name');

        if (!data.title)
            throw new MissingPropertyError('IdentityType', 'title');

        return conf.global.models.IdentityType.create(data);
    }

    /**
     * Gets a list of identities types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{IdentityTypeList}}
     */
    static getList(options) {
        return conf.global.models.IdentityType.findAll(complete(options, {}));
    }

    /**
     * Gets a identity type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the identity type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{IdentityType}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['identity type', 'name', name, 'IdentityType']})));
    }
}