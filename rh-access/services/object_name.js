import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class ObjectNameService {
    /**
     * Creates a new ObjectName row into DB.
     * @param {{name: string, title: {string}} data - data for the new ObjectName.
     *  - name: must be unique.
     * @returns {Promise{ObjectName}}
     */
    static async create(data) {
        if (!data.name)
            throw new MissingPropertyError('ObjectName', 'name');

        return conf.global.models.ObjectName.create(data);
    }

    /**
     * Gets a list of object names.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{ObjectNameList}}
     */
    static getList(options) {
        return conf.global.models.ObjectName.findAll(complete(options, {}));
    }

    /**
     * Gets a object name for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the object name to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ObjectName}}
     */
    static getForName(name, options) {
        return ObjectNameService.getList(deepComplete(options, {where:{name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['object name', 'name', name, 'ObjectName']})));
    }

    /**
     * Gets a object name ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the object name to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForName(name, options) {
        const rowList = await ObjectNameService.getList(deepComplete(options, {where:{name}, limit: 2}));
        const row = await getSingle(rowList, deepComplete(options, {params: ['object name', 'name', name, 'ObjectName']}));
        return row.id;
    }
    
    /**
     * Creates a new object name row into DB if not exists.
     * @param {data} data - data for the new object name @see create.
     * @returns {Promise{ObjectName}}
     */
    static createIfNotExists(data, options) {
        return ObjectNameService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return ObjectNameService.create(data);
            });
    }

    static getIdForNameCreateIfNotExists(data, options) {
        return ObjectNameService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row.id;

                ObjectNameService.create(data)
                    .then(row => row.id);
            });
    }
}