const UserTypeService = require('../services/user_type');
const IdentityService = require('../services/identity');
const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const UserService = {
    /**
     * Completes the data with the right typeId property value, from the type property value.
     * @param {{typeId: integer, type: string}} data - data object to complete. If type is not provided returns the type: 'user'.
     * @returns {Promise{data}}
     */
    async completeTypeId(data) {
        if (!data.typeId) {
            if (!data.type)
                data.type = 'user';

            const userType = await UserTypeService.getForName(data.type);
            data.typeId = userType.id;
        }

        return data;
    },

    /**
     * Creates a new user row into DB. If no typeId provided or type, 'user' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, username: string, displayName: string, typeId: integer, type: string}} data - data for the new User.
     *  - username: must be unique.
     * @returns {Promise{UserType}}
     */
    async create(data) {
        data = await UserService.completeTypeId(data);
        const user = await conf.global.models.User.create(data);
        if (data.password)
            await IdentityService.createLocal({
                password: data.password,
                userId: user.id,
            });

        return user;
    },

    /**
     * Gets a list of users. If not isEnabled filter provided returns only the enabled users.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{UserList}]
     */
    async getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}});
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'username', 'displayName'];
            
            if (!options.include) {
                options.include = [
                    { 
                        model: conf.global.models.UserType, 
                        attributes: ['uuid','name','title']
                    }        
                ];
            }
        }

        return await conf.global.models.User.findAll(options);
    },

    /**
     * Gets an user for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    getForUUID(uuid, options) {
        return UserService.getList(ru.deepComplete(options, {where: {uuid: uuid}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['user', ['UUID = %s', uuid], 'User']})));
    },

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    getForUsername(username, options) {
        return UserService.getList(ru.deepComplete(options, {where: {username: username}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['user', ['username = %s', username], 'User']})));
    },

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    async getIdForUsername(username, options) {
        return (await UserService.getForUsername(username, ru.deepComplete(options, {attributes: ['id']}))).id;
    },

    /**
     * Checks for an existent and enabled user. If the user exists and is enabled resolve, otherwise fail.
     * @param {User} user - user model object to check.
     * @param {*string} username - username only for result message purpuose.
     * @returns 
     */
    async checkEnabledUser(user, username) {
        if (!user)
            throw new ru._Error('User "%s" does not exist', username);

        if (!user.isEnabled)
            throw new ru._Error('User "%s" is not enabled', username);
    },

    /**
     * Deletes an user for a given UUID.
     * @param {string} uuid - UUID for the user o delete.
     * @returns {Promise{Result}} deleted rows count.
     */
    async deleteForUuid(uuid) {
        return await conf.global.models.User.destroy({where:{uuid: uuid}});
    },

    /**
     * Updates an user.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise{Result}} updated rows count.
     */
    async updateForUuid(data, uuid) {
        return await conf.global.models.User.update(data, {where:{uuid: uuid}});
    },

    /**
     * Enables an user for a given UUID.
     * @param {string} uuid - UUID for the user o enable.
     * @returns {Promise{Result}} enabled rows count.
     */
    async enableForUuid(uuid) {
        return await UserService.updateForUuid({isEnabled: true}, uuid);
    },

    /**
     * Disables an user for a given UUID.
     * @param {string} uuid - UUID for the user o disable.
     * @returns {Promise{Result}} disabled rows count.
     */
    async disableForUuid(uuid) {
        return await UserService.updateForUuid({isEnabled: false}, uuid);
    },
};

module.exports = UserService;