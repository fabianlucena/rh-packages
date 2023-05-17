import {UserTypeService} from '../services/user_type.js';
import {IdentityService} from '../services/identity.js';
import {conf} from '../conf.js';
import {getSingle, addEnabledFilter, addEnabledOnerModuleFilter} from 'sql-util';
import {complete, deepComplete, _Error} from 'rf-util';

export class UserService {
    /**
     * Completes the data with the right typeId property value, from the type property value.
     * @param {{typeId: integer, type: string}} data - data object to complete. If type is not provided returns the type: 'user'.
     * @returns {Promise{data}}
     */
    static async completeTypeId(data) {
        if (!data.typeId && data.type)
            data.typeId = await UserTypeService.getIdForName(data.type);

        return data;
    }

    /**
     * Creates a new user row into DB. If no typeId provided or type, 'user' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, username: string, displayName: string, typeId: integer, type: string}} data - data for the new User.
     *  - username: must be unique.
     * @returns {Promise{User}}
     */
    static async create(data) {
        if (data.type)
            data.type = 'user';

        if (!data.typeId && !data.type)
            data.type = 'user';

        data = await UserService.completeTypeId(data);
        const user = await conf.global.models.User.create(data);
        if (data.password) {
            await IdentityService.createLocal({
                password: data.password,
                userId: user.id,
            });
        }

        return user;
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'username', 'displayName'];
        }

        options.include ??= [];

        if (options.includeType) {
            options.include.push({ 
                model: conf.global.models.UserType, 
                attributes: ['uuid', 'name', 'title']
            });
        }

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
     * Gets a list of users.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{UserList}}
     */
    static async getList(options) {
        return conf.global.models.User.findAll(await UserService.getListOptions(options));
    }

    /**
     * Gets a list of users and the rows count.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{UserList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.User.findAndCountAll(await UserService.getListOptions(options));
    }

    /**
     * Gets an user for its ID. For many coincidences and for no rows this method fails.
     * @param {string} id - ID for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static get(id, options) {
        return UserService.getList(deepComplete(options, {where: {id}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['user', ['ID = %s', id], 'User']})));
    }

    /**
     * Gets an user for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static getForUuid(uuid, options) {
        return UserService.getList(deepComplete(options, {where: {uuid}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['user', ['UUID = %s', uuid], 'User']})));
    }

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static getForUsername(username, options) {
        return UserService.getList(deepComplete(options, {where: {username}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['user', ['username = %s', username], 'User']})));
    }

    /**
     * Gets an user for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static async getIdForUuid(uuid, options) {
        return (await UserService.getForUuid(uuid, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static async getIdForUsername(username, options) {
        return (await UserService.getForUsername(username, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Checks for an existent and enabled user. If the user exists and is enabled resolve, otherwise fail.
     * @param {User} user - user model object to check.
     * @param {*string} username - username only for result message purpuose.
     * @returns 
     */
    static async checkEnabledUser(user, username) {
        if (!user)
            throw new _Error('User "%s" does not exist', username);

        if (!user.isEnabled)
            throw new _Error('User "%s" is not enabled', username);
    }

    /**
     * Deletes an user for a given UUID.
     * @param {string} uuid - UUID for the user o delete.
     * @returns {Promise{Result}} deleted rows count.
     */
    static async deleteForUuid(uuid) {
        return await conf.global.models.User.destroy({where:{uuid}});
    }

    /**
     * Updates an user.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise{Result}} updated rows count.
     */
    static async updateForUuid(data, uuid) {
        data = await UserService.completeTypeId(data);
        const result = await conf.global.models.User.update(data, {where:{uuid}});
        
        if (data.password) {
            const user = await UserService.getForUuid(uuid);
            const identity = await IdentityService.getLocalForUsername(user.username);
            if (identity?.id) {
                console.log(await IdentityService.updateForId({password: data.password}, identity?.id));
            } else {
                await IdentityService.createLocal({
                    password: data.password,
                    userId: user.id,
                });
            }
        }

        return result;
    }

    /**
     * Enables an user for a given UUID.
     * @param {string} uuid - UUID for the user o enable.
     * @returns {Promise{Result}} enabled rows count.
     */
    static async enableForUuid(uuid) {
        return await UserService.updateForUuid({isEnabled: true}, uuid);
    }

    /**
     * Disables an user for a given UUID.
     * @param {string} uuid - UUID for the user o disable.
     * @returns {Promise{Result}} disabled rows count.
     */
    static async disableForUuid(uuid) {
        return await UserService.updateForUuid({isEnabled: false}, uuid);
    }
    
    /**
     * Creates a new User row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static createIfNotExists(data, options) {
        return UserService.getForUsername(data.username, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return UserService.create(data);
            });
    }
}