import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class ShareTypeService {
    /**
     * Creates a new ShareType row into DB.
     * @param {{name: string, title: {string}} data - data for the new ShareType.
     *  - name: must be unique.
     * @returns {Promise{ShareType}}
     */
    static async create(data) {
        if (!data.name)
            throw new MissingPropertyError('ShareType', 'name');

        if (!data.title)
            throw new MissingPropertyError('ShareType', 'title');

        return conf.global.models.ShareType.create(data);
    }

    /**
     * Gets a list of share types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{ShareTypeList}}
     */
    static getList(options) {
        return conf.global.models.ShareType.findAll(complete(options, {}));
    }

    /**
     * Gets a share type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the share type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{ShareType}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['share type', 'name', name, 'ShareType']})));
    }

    /**
     * Gets a share type ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the share type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForName(name, options) {
        const rowList = await this.getList(deepComplete(options, {where:{name}, limit: 2}));
        const row = await getSingle(rowList, deepComplete(options, {params: ['share type', 'name', name, 'ShareType']}));
        return row.id;
    }
    
    /**
     * Creates a new share type row into DB if not exists.
     * @param {data} data - data for the new share type @see create.
     * @returns {Promise{ShareType}}
     */
    static createIfNotExists(data, options) {
        return ShareTypeService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return ShareTypeService.create(data);
            });
    }
}