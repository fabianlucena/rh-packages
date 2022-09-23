const IdentityTypeService = require('../services/identity_type');
const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');
const crypto = require('crypto');

const IdentityService = {
    /**
     * Hash the password with a randomic salt
     * @param {string} password - the plain passwor to be hashed 
     * @returns {Promise{string}} - hashed password in hex text format
     */
    hashPassword(password) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(8).toString("hex");
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err)
                    return reject(err);

                resolve(salt + ':' + derivedKey.toString('hex'));
            });
        })
    },

    /**
     * Completes, if not exists, the data property of data object with the hashed JSON password data, taked from the password property.
     * @param {{data: string, password: JSON}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    completeDataFromHashPassword(data) {
        return new Promise((resolve, reject) => {
            if (data.data)
                return resolve(data);

            if (!data.password)
                return reject(new sqlUtil.MissingPropertyError('Identity', 'type'));

            return IdentityService.hashPassword(data.password)
                .then(hash => {
                    data.data = '{"password":"' + hash + '"}';
                    resolve(data);
                })
                .catch(reject);
        });
    },

    /**
     * Completes, if not exists, the typeId property of the data object with the ID of the type taken from the type property,
     * @param {{typeId: integer, type: string}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    completeTypeId(data) {
        return new Promise((resolve, reject) => {
            if (data.typeId)
                return resolve(data);

            if (!data.type)
                return reject(new sqlUtil.MissingPropertyError('Identity', 'type'));

            return IdentityTypeService.getForName(data.type)
                .then(it => {
                    data.typeId = it.id;
                    resolve(data);
                });
        });
    },

    /**
     * Creates a new Identity in the database, but before hash the password and get the typeId. If both properties data and password are defined password property is ignored. Also for both typeId and type, type is ignored.
     * @param {{isEnabled: boolean, data: JSON, userId: integer, typeId: integer, password: string, type: string}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    create(data) {
        return IdentityService.completeDataFromHashPassword(data)
            .then(data => IdentityService.completeTypeId(data))
            .then(data => conf.global.models.Identity.create(data));
    },

    /**
     * Creates a local identity, this method set the type property of data to 'local' and then calls create method.
     * @param {{isEnabled: boolean, data: JSON, userId: integer}} data - data to pass to create method.
     * @returns {Promise{data}}
     */
    createLocal(data) {
        delete data.typeId;
        data.type = 'local';
        return IdentityService.create(data);
    },

    /**
     * Gets a list of identities. If not isEnabled filter provided returns only the enabled identities.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{DeviceList}]
     */
    getList(options) {
        return conf.global.models.Identity.findAll(ru.deepComplete(options, {where: {isEnabled: true}}));
    },
    
    /**
     * Get the identity for a given username and type name. If not exists or exist mani cohincidences the method fails. If the isEnabled value is not defined this value is setted to true.
     * @param {string} username - the username to search.
     * @param {string} typeName - the typename to search.
     * @param {OptionsObject} options - For valid options see: sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
     * @returns {Promise{Identity}}
     */
    async getForUsernameTypeName(username, typeName, options) {
        options = ru.complete(options, {include: [], limit: 2});
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.IdentityType, where: {name:     typeName}, required: true}, options));
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.User,         where: {username: username}, required: true}, options));

        const rowList = await IdentityService.getList(options);
        return sqlUtil.getSingle(rowList, options);
    },

    /**
     * Get the 'local' type identity for a given username. See getForUsernameTypeName for more details.
     * @param {string} username - the username to search. 
     * @param {OptionsObject} options - For valid options see: sqlUtil.getForUsernameTypeName method.
     * @returns {Promise{Identity}}
     */
    getLocalForUsername(username, options) {
        return IdentityService.getForUsernameTypeName(username, 'local', options);
    },

    /**
     * Checks the password for a local identity of the username user.
     * @param {string} username - the username for check password.
     * @param {string} password - the plain password to check.
     * @returns {Promise{bool}}
     */
    checkLocalPasswordForUsername(username, password, locale) {
        return new Promise((resolve, reject) => {
            IdentityService.getLocalForUsername(username)
                .then(identity => {
                    if (!identity)
                        return reject(locale._('User "%s" does not have local identity', username));

                    if (!identity.isEnabled)
                        return reject(locale._('User "%s" local entity is not enabled', username));
                    
                    if (!identity.data)
                        return reject(locale._('User "%s" does not have local identity data', username));
                    
                    const data = JSON.parse(identity.data);
                    if (!data || !data.password)
                        return reject(locale._('User "%s" does not have local password', username));

                    const [salt, key] = data.password.split(":");
                    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                        if (err)
                            reject(err);
                        
                        resolve(key == derivedKey.toString('hex'))
                    });
                })
                .catch(err => 
                    reject(locale._("Can't get the identity for: \"%s\", %s", username, err))
                );
        });
    },           
};

module.exports = IdentityService;