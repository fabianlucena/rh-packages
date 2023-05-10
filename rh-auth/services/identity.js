import {IdentityTypeService} from '../services/identity_type.js';
import {UserService} from '../services/user.js';
import {conf} from '../conf.js';
import {checkDataForMissingProperties, MissingPropertyError, completeAssociationOptions, addEnabledFilter, getSingle} from 'sql-util';
import {complete} from 'rf-util';
import crypto from 'crypto';

export class IdentityService {
    /**
     * Hash the password with a randomic salt
     * @param {string} password - the plain passwor to be hashed 
     * @returns {Promise{string}} - hashed password in hex text format
     */
    static hashPassword(password) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(8).toString('hex');
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err)
                    return reject(err);

                resolve(salt + ':' + derivedKey.toString('hex'));
            });
        });
    }

    /**
     * Completes, if not exists, the data property of data object with the hashed JSON password data, taked from the password property.
     * @param {{data: string, password: JSON}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    static completeDataFromHashPassword(data) {
        return new Promise((resolve, reject) => {
            if (data.data)
                return resolve(data);

            if (!data.password)
                return reject(new MissingPropertyError('Identity', 'type'));

            return IdentityService.hashPassword(data.password)
                .then(hash => {
                    data.data = '{"password":"' + hash + '"}';
                    resolve(data);
                })
                .catch(reject);
        });
    }

    /**
     * Completes, if not exists, the typeId property of the data object with the ID of the type taken from the type property,
     * @param {{typeId: integer, type: string}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    static async completeTypeId(data) {
        if (!data.typeId && data.type)
            data.typeId = await IdentityTypeService.getIdForName(data.type);

        return data;
    }

    /**
     * Completes, if not exists, the userId property of the data object with the ID of the user taken from the user property,
     * @param {{userId: integer, user: string}}
     * @returns {Promise{data}}
     */
    static async completeUserId(data) {
        if (!data.userId && data.username)
            data.userId = await UserService.getIdForUsername(data.username);

        return data;
    }

    /**
     * Creates a new Identity in the database, but before hash the password and get the typeId. If both properties data and password are defined password property is ignored. Also for both typeId and type, type is ignored.
     * @param {{isEnabled: boolean, data: JSON, userId: integer, typeId: integer, password: string, type: string}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    static async create(data) {
        await IdentityService.completeUserId(data);
        await IdentityService.completeTypeId(data);
        await IdentityService.completeDataFromHashPassword(data);

        checkDataForMissingProperties(data, 'Identity', 'type', 'typeId', 'username', 'userId');

        return conf.global.models.Identity.create(data);
    }

    /**
     * Creates a local identity, this method set the type property of data to 'local' and then calls create method.
     * @param {{isEnabled: boolean, data: JSON, userId: integer}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    static createLocal(data) {
        delete data.typeId;
        data.type = 'local';
        return IdentityService.create(data);
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

        return options;
    }

    /**
     * Gets a list of identities. If not isEnabled filter provided returns only the enabled identities.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{DeviceList}]
     */
    static async getList(options) {
        return conf.global.models.Identity.findAll(await IdentityService.getListOptions(options));
    }
    
    /**
     * Get the identity for a given username and type name. If not exists or exist mani cohincidences the method fails. If the isEnabled value is not defined this value is setted to true.
     * @param {string} username - the username to search.
     * @param {string} typeName - the typename to search.
     * @param {OptionsObject} options - For valid options see: sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
     * @returns {Promise{Identity}}
     */
    static async getForUsernameTypeName(username, typeName, options) {
        options = complete(options, {include: [], limit: 2});
        options.include.push(completeAssociationOptions({model: conf.global.models.IdentityType, where: {name: typeName}, required: true}, options));
        options.include.push(completeAssociationOptions({model: conf.global.models.User,         where: {username},       required: true}, options));

        const rowList = await IdentityService.getList(options);
        return getSingle(rowList, options);
    }

    /**
     * Get the 'local' type identity for a given username. See getForUsernameTypeName for more details.
     * @param {string} username - the username to search. 
     * @param {OptionsObject} options - For valid options see: sqlUtil.getForUsernameTypeName method.
     * @returns {Promise{Identity}}
     */
    static getLocalForUsername(username, options) {
        return IdentityService.getForUsernameTypeName(username, 'local', options);
    }

    /**
     * Checks the password for a local identity of the username user.
     * @param {string} username - the username for check password.
     * @param {string} password - the plain password to check.
     * @returns {Promise{bool}}
     */
    static checkLocalPasswordForUsername(username, password, loc) {
        return new Promise((resolve, reject) => {
            IdentityService.getLocalForUsername(username)
                .then(async identity => {
                    if (!identity)
                        return reject(await loc._('User "%s" does not have local identity', username));

                    if (!identity.isEnabled)
                        return reject(await loc._('User "%s" local entity is not enabled', username));
                    
                    if (!identity.data)
                        return reject(await loc._('User "%s" does not have local identity data', username));
                    
                    const data = JSON.parse(identity.data);
                    if (!data || !data.password)
                        return reject(await loc._('User "%s" does not have local password', username));

                    const [salt, key] = data.password.split(':');
                    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                        if (err)
                            reject(err);
                        
                        resolve(key == derivedKey.toString('hex'));
                    });
                })
                .catch(async err => 
                    reject(await loc._('Can\'t get the identity for: "%s", %s', username, err))
                );
        });
    }
    
    /**
     * Creates a new identity row into DB if not exists.
     * @param {data} data - data for the new identity @see create.
     * @returns {Promise{Identity}}
     */
    static createIfNotExists(data, options) {
        return IdentityService.getForUsernameTypeName(data.username, data.type, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return IdentityService.create(data);
            });
    }
}