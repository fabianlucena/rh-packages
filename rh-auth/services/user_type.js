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
     * Gets a list of users types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{UserTypeList}]
     */
    static getList(options) {
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

        if (options.withCount)
            return conf.global.models.UserType.findAndCountAll(options);
        else
            return conf.global.models.UserType.findAll(options);
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