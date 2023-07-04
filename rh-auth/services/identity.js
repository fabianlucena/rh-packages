'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidEnable} from 'rf-service';
import {checkDataForMissingProperties, MissingPropertyError, completeAssociationOptions, addEnabledFilter, getSingle} from 'sql-util';
import crypto from 'crypto';

export class IdentityService extends ServiceIdUuidEnable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Identity;
    references = {
        type: conf.global.services.IdentityType,
        username: {
            service: conf.global.services.User,
            name: 'username',
            Name: 'User',
            idPropertyName: 'userId',
            uuidPropertyName: 'userUuid',
            getIdForName: 'getIdForUsername',
        },
    };
    defaultTranslationContext = 'identity';

    /**
     * Hash the password with a randomic salt
     * @param {string} password - the plain passwor to be hashed 
     * @returns {Promise[string]} - hashed password in hex text format
     */
    async hashPassword(password) {
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
     * Completes, if not exists, the data property of data object with the hashed JSON password data, 
     * taked from the password property.
     * @param {{data: string, password: JSON}} data - data to pass to create method.
     * @returns {Promise[data]}
     */
    async completeDataFromPassword(data) {
        if (!data.password)
            return data;

        let jsonData;
        if (data.data)
            jsonData = JSON.parse(data.data);
        else
            jsonData = {};

        jsonData.password = await this.hashPassword(data.password);
        data.data = JSON.stringify(jsonData);

        return data;
    }

    async validateForCreation(data) {
        await this.completeDataFromPassword(data);

        if (!data.data)
            throw new MissingPropertyError('Identity', 'password');

        checkDataForMissingProperties(data, 'Identity', 'typeId', 'userId');

        return true;
    }

    /**
     * Creates a local identity, this method set the type property of data to 'local' and then calls create method.
     * @param {{isEnabled: boolean, data: JSON, userId: integer}} data - data to pass to create method.
     * @returns {Promise[data]}
     */
    async createLocal(data) {
        delete data.typeId;
        data.type = 'local';
        return this.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        return options;
    }

    /**
     * Get the identity for a given username and type name. If not exists or exist many cohincidences the method fails. If the isEnabled value is not defined this value is setted to true.
     * @param {string} username - the username to search.
     * @param {string} typeName - the typename to search.
     * @param {OptionsObject} options - For valid options see: sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
     * @returns {Promise[Identity]}
     */
    async getForUsernameTypeName(username, typeName, options) {
        options = {include: [], limit: 2, ...options};
        options.include.push(completeAssociationOptions({model: conf.global.models.IdentityType, where: {name: typeName}, required: true}, options));
        options.include.push(completeAssociationOptions({model: conf.global.models.User,         where: {username},       required: true}, options));

        const rowList = await this.getList(options);
        return getSingle(rowList, options);
    }

    /**
     * Get the 'local' type identity for a given username. See getForUsernameTypeName for more details.
     * @param {string} username - the username to search. 
     * @param {OptionsObject} options - For valid options see: sqlUtil.getForUsernameTypeName method.
     * @returns {Promise[Identity]}
     */
    async getLocalForUsername(username, options) {
        return this.getForUsernameTypeName(username, 'local', options);
    }

    /**
     * Checks the password for a local identity of the username user.
     * @param {string} username - the username for check password.
     * @param {string} password - the plain password to check.
     * @returns {Promise[bool|errorMessage]}
     */
    async checkLocalPasswordForUsername(username, rawPassword, loc) {
        const identity = await this.getLocalForUsername(username);

        if (!identity)
            return loc._c('identity', 'User "%s" does not have local identity', username);

        if (!identity.isEnabled)
            return loc._c('identity', 'User "%s" local identity is not enabled', username);
        
        if (!identity.data)
            return loc._c('identity', 'User "%s" does not have local identity data', username);
            
        const data = JSON.parse(identity.data);
        if (!data || !data.password)
            return loc._c('identity', 'User "%s" does not have local password', username);

        return this.checkRawPasswordAndEncryptedPassword(rawPassword, data.password);
    }

    /**
     * Checks if the password match with the encripted password.
     * @param {string} rawPassword - the username for check password.
     * @param {string} encriptedPassword - the plain password to check.
     * @returns {Promise[bool|errorMessage]}
     */
    async checkRawPasswordAndEncryptedPassword(rawPassword, encriptedPassword) {
        return new Promise(resolve => {
            const [salt, key] = encriptedPassword.split(':');
            crypto.scrypt(rawPassword, salt, 64, (err, derivedKey) => {
                if (err)
                    resolve(err);
                
                resolve(key == derivedKey.toString('hex'));
            });
        });
    }
    
    /**
     * Creates a new identity row into DB if not exists.
     * @param {data} data - data for the new identity @see create.
     * @returns {Promise[Identity]}
     */
    async createIfNotExists(data, options) {
        const row = this.getForUsernameTypeName(data.username, data.type, {attributes: ['id'], skipNoRowsError: true, ...options});
        if (row)
            return row;

        return this.create(data);
    }

    /**
     * Updates an identity.
     * @param {object} data - Data to update.
     * @param {object} where - Where object with the criteria to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async update(data, where) {
        if (data.password) {
            if (!data.data) {
                const identity = await this.getFor(where);
                data.data = identity.data;
            }

            await this.completeDataFromPassword(data);
        }

        return super.update(data, where);
    }
}