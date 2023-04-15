import {conf} from '../conf.js';
import {getSingle} from 'sql-util';
import {complete, deepComplete} from 'rofa-util';

export class UserTypeService {
    /**
     * Creates a new user type row into DB.
     * @param {{name: string, title: string} data - data for the new UserType.
     *  - name: must be unique.
     * @returns {Promise{UserType}}
     */
    static create(data) {
        return conf.global.models.UserType.create(data);
    }

    /**
     * Gets a list of users types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{UserTypeList}]
     */
    static getList(options) {
        return conf.global.models.UserType.findAll(complete(options, {}));
    }

    /**
     * Gets an user type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the user type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{UserType}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['user type', 'name', name, 'UserType']})));
    }
}