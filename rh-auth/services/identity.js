import { Service } from 'rf-service';
import { checkDataForMissingProperties, MissingPropertyError } from 'sql-util';
import crypto from 'crypto';

export class IdentityService extends Service.IdUuidEnable {
  references = {
    type: {
      service: 'identityTypeService',
      createIfNotExists: true,
      whereColumn: 'name',
    },
    user: {
      whereColumn: 'username',
    },
  };

  /**
   * Hash the password with a randomic salt
   * @param {string} password - the plain passwor to be hashed 
   * @returns {Promise[string]} - hashed password in hex text format
   */
  async hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(8)
        .toString('base64')
        .replaceAll('=', '');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) {
          return reject(err);
        }

        resolve(salt + ':' + derivedKey.toString('base64').replaceAll('=', ''));
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
    if (!data.password) {
      return data;
    }

    let jsonData;
    if (data.data) {
      jsonData = JSON.parse(data.data);
    } else {
      jsonData = {};
    }

    jsonData.password = await this.hashPassword(data.password);
    data.data = JSON.stringify(jsonData);

    return data;
  }

  async validateForCreation(data) {
    await this.completeDataFromPassword(data);

    checkDataForMissingProperties(data, 'Identity', 'typeId', 'userId');

    return super.validateForCreation(data);
  }

  /**
   * Creates a local identity, this method set the type property of data to 'local' and then calls create method.
   * @param {{isEnabled: boolean, password: string, userId: integer}} data - data to pass to create method.
   * @param {object} options - options to pass to creator, for use transaction.
   * @returns {Promise[data]}
   */
  async createLocal(data, options) {
    if (!data.password) {
      throw new MissingPropertyError('Identity', 'password');
    }
    
    delete data.typeId;
    data.type = 'local';
    
    return this.create(data, options);
  }

  /**
   * Get the identity for a given user ID and type name. If not exists or exist many cohincidences the method fails. If the isEnabled value is not defined this value is setted to true.
   * @param {string} userId - the user ID to search.
   * @param {string} typeName - the typename to search.
   * @param {OptionsObject} options - For valid options see: sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
   * @returns {Promise[Identity]}
   */
  async getForUserIdAndTypeName(userId, typeName, options) {
    options = {
      limit: 2,
      ...options,
      where: {
        ...options?.where,
        userId,
        type: typeName,
      }
    };

    return this.getSingle(options);
  }

  /**
   * Get the identity for a given username and type name. If not exists or 
   * exist many cohincidences the method fails. If the isEnabled value is not 
   * defined this value is setted to true.
   * @param {string} username - the username to search.
   * @param {string} typeName - the typename to search.
   * @param {OptionsObject} options - For valid options see: 
   * sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
   * @returns {Promise[Identity]}
   */
  async getForUsernameAndTypeName(username, typeName, options) {
    options = {
      limit: 2,
      ...options,
      where: {
        ...options?.where,
        user: username,
        type: typeName,
      }
    };

    return this.getSingle(options);
  }

  /**
   * Get the identity for a given username in identity and type name. If not 
   * exists or if exist many cohincidences the method fails. If the isEnabled 
   * value is not defined this value is setted to true.
   * @param {string} username - the username in identity to search.
   * @param {string} typeName - the typename to search.
   * @param {OptionsObject} options - For valid options see: 
   * sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
   * @returns {Promise[Identity]}
   */
  async getForUsernameIdentityAndTypeName(usernameIdentity, typeName, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        user: usernameIdentity,
        type: typeName,
        data: `"username":"${usernameIdentity}"`
      }
    };

    return this.getSingle(options);
  }

  /**
   * Get the identity for a given username in identity and type name or null. 
   * If not exists returns null. If exist many cohincidences the method fails. 
   * If the isEnabled value is not defined this value is setted to true.
   * @param {string} username - the username in identity to search.
   * @param {string} typeName - the typename to search.
   * @param {OptionsObject} options - For valid options see: 
   * sqlUtil.completeAssociationOptions method, and sqlUtil.getSingle.
   * @returns {Promise[Identity]}
   */
  async getForUsernameIdentityAndTypeNameOrNull(usernameIdentity, typeName, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        user: usernameIdentity,
        type: typeName,
        data: `"username":"${usernameIdentity}"`
      }
    };

    return this.getSingleOrNull(options);
  }

  /**
   * Get the 'local' type identity for a given user ID. See 
   * getForUserIdAndTypeName for more details.
   * @param {string} userId - the user ID to search. 
   * @param {object} options - For valid options see: 
   * sqlUtil.getForUserIdAndTypeName method.
   * @returns {Promise[Identity]}
   */
  async getLocalForUserId(userId, options) {
    return this.getForUserIdAndTypeName(userId, 'local', options);
  }

  /**
   * Get the 'local' type identity for a given username. See 
   * getForUsernameAndTypeName for more details.
   * @param {string} username - the username to search. 
   * @param {OptionsObject} options - For valid options see: 
   * sqlUtil.getForUsernameAndTypeName method.
   * @returns {Promise[Identity]}
   */
  async getLocalForUsername(username, options) {
    return this.getForUsernameAndTypeName(username, 'local', options);
  }

  /**
   * Checks the password for a local identity of the username user.
   * @param {string} username - the username for check password.
   * @param {string} password - the plain password to check.
   * @returns {Promise[bool|errorMessage]}
   */
  async checkLocalPasswordForUsername(username, rawPassword, loc) {
    const identity = await this.getLocalForUsername(username);

    if (!identity) {
      return loc._c('identity', 'User "%s" does not have local identity', username);
    }

    if (!identity.isEnabled) {
      return loc._c('identity', 'User "%s" local identity is not enabled', username);
    }
        
    if (!identity.data) {
      return loc._c('identity', 'User "%s" does not have local identity data', username);
    }
            
    const data = JSON.parse(identity.data);
    if (!data || !data.password) {
      return loc._c('identity', 'User "%s" does not have local password', username);
    }

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
        if (err) {
          resolve(err);
          return;
        }
        
        if (key == derivedKey.toString('hex')) {
          resolve(true);
          return;
        }

        if (key == derivedKey.toString('base64').replaceAll('=', '')) {
          resolve(true);
          return;
        }

        resolve(false);
      });
    });
  }
    
  /**
   * Creates a new identity row into DB if not exists.
   * @param {data} data - data for the new identity @see create.
   * @returns {Promise[Identity]}
   */
  async createIfNotExists(data, options) {
    const row = this.getForUsernameAndTypeName(
      data.username,
      data.type,
      {
        attributes: ['id'],
        skipNoRowsError: true,
        ...options,
      },
    );
    if (row) {
      return row;
    }

    return this.create(data);
  }

  /**
   * Updates an identity.
   * @param {object} data - Data to update.
   * @param {object} where - Where object with the criteria to update.
   * @returns {Promise[integer]} updated rows count.
   */
  async update(data, options) {
    if (data.password) {
      if (!data.data) {
        const identity = await this.getFor(options.where);
        data.data = identity.data;
      }

      await this.completeDataFromPassword(data);
    }

    return super.update(data, options);
  }
}