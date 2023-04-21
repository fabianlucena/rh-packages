import {UserTypeService} from '../services/user_type.js';
import {IdentityService} from '../services/identity.js';
import {conf} from '../conf.js';
import {getSingle} from 'sql-util';
import {complete, deepComplete, _Error} from 'rofa-util';

export class UserService {
    /**
     * Completes the data with the right typeId property value, from the type property value.
     * @param {{typeId: integer, type: string}} data - data object to complete. If type is not provided returns the type: 'user'.
     * @returns {Promise{data}}
     */
    static async completeTypeId(data) {
        if (!data.typeId) {
            if (!data.type)
                data.type = 'user';

            const userType = await UserTypeService.getForName(data.type);
            data.typeId = userType.id;
        }

        return data;
    }

    /**
     * Creates a new user row into DB. If no typeId provided or type, 'user' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, username: string, displayName: string, typeId: integer, type: string}} data - data for the new User.
     *  - username: must be unique.
     * @returns {Promise{UserType}}
     */
    static async create(data) {
        data = await UserService.completeTypeId(data);
        const user = await conf.global.models.User.create(data);
        if (data.password)
            await IdentityService.createLocal({
                password: data.password,
                userId: user.id,
            });

        return user;
    }

    /**
     * Gets a list of users. If not isEnabled filter provided returns only the enabled users.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{UserList}]
     */
    static async getList(options) {
        options = deepComplete(options, {where: {isEnabled: true}});
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'username', 'displayName'];
            
            if (!options.include) {
                options.include = [
                    { 
                        model: conf.global.models.UserType, 
                        attributes: ['uuid', 'name', 'title']
                    }        
                ];
            }
        }

        return await conf.global.models.User.findAll(options);
    }

    /**
     * Gets an user for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static getForUUID(uuid, options) {
        return UserService.getList(deepComplete(options, {where: {uuid: uuid}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['user', ['UUID = %s', uuid], 'User']})));
    }

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    static getForUsername(username, options) {
        return UserService.getList(deepComplete(options, {where: {username: username}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['user', ['username = %s', username], 'User']})));
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
        return await conf.global.models.User.destroy({where:{uuid: uuid}});
    }

    /**
     * Updates an user.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise{Result}} updated rows count.
     */
    static async updateForUuid(data, uuid) {
        return await conf.global.models.User.update(data, {where:{uuid: uuid}});
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
}