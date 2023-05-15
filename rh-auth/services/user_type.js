import {conf} from '../conf.js';
import {addEnabledFilter, addEnabledOnerModuleFilter, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

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
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {username:    {[Op.like]: q}},
                    {displayName: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            if (conf.global.models.Module)
                options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets a list of users types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{UserTypeList}}
     */
    static async getList(options) {
        return conf.global.models.UserType.findAll(await UserTypeService.getListOptions(options));
    }

    /**
     * Gets a list of users types ant the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{UserTypeList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.UserType.findAndCountAll(await UserTypeService.getListOptions(options));
    }

    /**
     * Gets an user type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the user type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{UserType}}
     */
    static getForName(name, options) {
        return this.getList(deepComplete(options, {where:{name}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['user type', 'name', name, 'UserType']})));
    }

    /**
     * Gets an user type ID for its name.
     * @param {string} name - name for the user type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{UserType}}
     */
    static getIdForName(name, options) {
        return this.getForName(name, options)
            .then(type => type.id);
    }
    
    /**
     * Creates a new user type row into DB if not exists.
     * @param {data} data - data for the new user type @see create.
     * @returns {Promise{UserTYpe}}
     */
    static createIfNotExists(data, options) {
        return UserTypeService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return UserTypeService.create(data);
            });
    }
}