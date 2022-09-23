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
    completeTypeId(data) {
        return new Promise((resolve, reject) => {
            if (data.typeId)
                return resolve(data);

            if (!data.type)
                data.type = 'user';

            return UserTypeService.getForName(data.type)
                .then(ut => {
                    data.typeId = ut.id;
                    resolve(data);
                });
        });
    },

    /**
     * Creates a new user row into DB. If no typeId provided or type, 'user' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, username: string, displayName: string, typeId: integer, type: string}} data - data for the new User.
     *  - username: must be unique.
     * @returns {Promise{UserType}}
     */
    create(data) {
        return this.completeTypeId(data)
            .then(data => {
                return conf.global.models.User.create(data)
                    .then(u => {
                        if (data.password) {
                            const identityData = {
                                password: data.password,
                                userId: u.id,
                            };
                        
                            return IdentityService.createLocal(identityData);
                        }
                    });
            });
    },

    /**
     * Gets a list of users. If not isEnabled filter provided returns only the enabled users.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{UserList}]
     */
    getList(options) {
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

        return conf.global.models.User.findAll(options);
    },

    /**
     * Gets a user for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    getForUUID(uuid, options) {
        return UserService.getList(ru.deepComplete(options, {where: {uuid: uuid}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['user', ['UUID = %s', uuid], 'User']})));
    },

    /**
     * Gets a user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    getForUsername(username, options) {
        return UserService.getList(ru.deepComplete(options, {where: {username: username}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.complete(options, {params: ['user', ['username = %s', username], 'User']})));
    },

    /**
     * Gets a user for its username. For many coincidences and for no rows this method fails.
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
     * Deletes a user for a given UUID.
     * @param {string} uuid - UUID for the user o delete.
     * @returns {Promise{Result}}
     */
    deleteForUuid(uuid) {
        return conf.global.models.User.destroy({where:{uuid: uuid}});
    },
};

module.exports = UserService;