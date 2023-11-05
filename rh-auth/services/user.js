import {IdentityService} from '../services/identity.js';
import {conf} from '../conf.js';
import {ServiceIdUuidEnabledModule} from 'rf-service';
import {getSingle} from 'sql-util';
import {_ConflictError} from 'http-util';
import {checkParameter} from 'rf-util';
import {_Error} from 'rf-util';
import {loc} from 'rf-locale';

export class UserService extends ServiceIdUuidEnabledModule {
    sequelize = conf.global.sequelize;
    model = conf.global.models.User;
    references = {
        type: conf.global.services.UserType.singleton(),
    };
    defaultTranslationContext = 'user';
    searchColumns = ['username', 'displayName'];

    async validateForCreation(data) {
        data ??= {};

        if (!data.typeId && !data.type) {
            data.type = 'user';
        }

        checkParameter(data, {username: loc._cf('user', 'Username'), displayName: loc._cf('user', 'Display name')});
        if (await this.getForUsername(data.username, {check: false, skipNoRowsError: true})) {
            throw new _ConflictError(loc._cf('user', 'Another user with the same username already exists.'));
        }

        if (await this.getForDisplayName(data.displayName, {check: false, skipNoRowsError: true})) {
            throw new _ConflictError(loc._cf('user', 'Another user with the same display name already exists.'));
        }

        return super.validateForCreation(data);
    }

    /**
     * Creates a new user row into DB. If no typeId provided or type, 'user' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, username: string, displayName: string, typeId: integer, type: string}} data - data for the new User.
     *  - username: must be unique.
     * @returns {Promise[User]}
     */
    async create(data, options) {
        const user = await super.create(data, options);
        if (data.password) {
            await IdentityService.singleton().createLocal(
                {
                    password: data.password,
                    userId: user.id,
                },
                options
            );
        }

        return user;
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {object} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {object}
     */
    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'username', 'displayName'];
            }
        }

        options.include ??= [];

        if (options.includeType) {
            options.include.push({ 
                model: conf.global.models.UserType, 
                attributes: ['uuid', 'name', 'title']
            });
        }

        return super.getListOptions(options);
    }

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    async getForUsername(username, options) {
        options = {...options, where: {...options?.where, username}};

        if (Array.isArray(username)) {
            return this.getList(options);
        }

        options.limit ??= 2;
        const rows = await this.getList(options);

        return getSingle(rows, {params: ['user', ['username = %s', username], 'User'], ...options});
    }

    /**
     * Gets an user for its display name. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{User}}
     */
    async getForDisplayName(displayName, options) {
        options = {...options, where: {...options?.where, displayName}};

        if (Array.isArray(displayName)) {
            return this.getList(options);
        }

        options.limit ??= 2;
        const rows = await this.getList(options);

        return getSingle(rows, {params: ['user', ['displayName = %s', displayName], 'User'], ...options});
    }

    /**
     * Gets an user for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the user to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise[BigInt|Array[BigInt]]}
     */
    async getIdForUsername(username, options) {
        const result = await this.getForUsername(username, {attributes: ['id'], ...options});
        if (Array.isArray(username)) {
            return result.map(row => row.id);
        }
        
        return result.id;
    }

    /**
     * Checks for an existent and enabled user. If the user exists and is enabled resolve, otherwise fail.
     * @param {User} user - user model object to check.
     * @param {*string} username - username only for result message purpuose.
     * @returns 
     */
    async checkEnabledUser(user, username) {
        if (!user) {
            throw new _Error(loc._cf('user', 'User "%s" does not exist'), username);
        }

        if (!user.isEnabled) {
            throw new _Error(loc._cf('user', 'User "%s" is not enabled'), username);
        }

        return true;
    }

    /**
     * Updates an user.
     * @param {object} data - Data to update.
     * @param {object} where - Where object with the criteria to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async update(data, where) {
        const result = await super.update(data, where);
        if (!result) {
            return result;
        }

        if (data.password) {
            const identityService = IdentityService.singleton();
            const user = await this.getFor(where);
            const identity = await identityService.getLocalForUsername(user.username);
            if (identity?.id) {
                await identityService.updateForId({password: data.password}, identity.id);
            } else {
                await identityService.createLocal({
                    password: data.password,
                    userId: user.id,
                });
            }
        }

        return result;
    }

    /**
     * Creates a new User row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    async createIfNotExists(data, options) {
        const row = await this.getForUsername(data.username, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options});
        if (row) {
            return row;
        }

        return this.create(data);
    }
}