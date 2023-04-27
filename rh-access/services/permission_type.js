import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class PermissionTypeService {
    /**
     * Creates a new PermissionType row into DB.
     * @param {{name: string, title: {string}} data - data for the new PermissionType.
     *  - name: must be unique.
     * @returns {Promise{PermissionType}}
     */
    static async create(data) {
        if (!data.name)
            throw new MissingPropertyError('PermissionType', 'name');

        if (!data.title)
            throw new MissingPropertyError('PermissionType', 'title');

        return conf.global.models.PermissionType.create(data);
    }

    /**
     * Gets a list of permissions types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionTypeList}}
     */
    static getList(options) {
        return conf.global.models.PermissionType.findAll(complete(options, {}));
    }

    /**
     * Gets a permission type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{PermissionType}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['permission type', 'name', name, 'PermissionType']})));
    }
    
    /**
    * Gets a permission type ID for its name. For many coincidences and for no rows this method fails.
    * @param {string} name - name for the permission type to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{Permission}}
    */
    static async getIdForName(name, options) {
        return (await PermissionTypeService.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Creates a new Permission type row into DB if not exists.
     * @param {data} data - data for the new Permission @see create.
     * @returns {Promise{PermissionType}}
     */
    static createIfNotExists(data, options) {
        return PermissionTypeService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return PermissionTypeService.create(data);
            });
    }
}