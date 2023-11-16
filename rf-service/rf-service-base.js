import {NoRowsError, ManyRowsError} from './rf-service-errors.js';
import {ucfirst, lcfirst} from 'rf-util/rf-util-string.js';
import {arrangeOptions} from 'sql-util';
import {trim, _Error} from 'rf-util';
import {loc} from 'rf-locale';

export class ServiceBase {
    /**
     * Here are spicifed the references for properties. The referencers have the form proeprtyName: options.
     * {
     *  user: {
     *      service: conf.global.services.User,
     *      name: 'username',
     *  },
     *  site: conf.global.services.Site,
     * }
     * 
     * The options for each reference are:
     *  - idPropertyName: the name for ID property to use in reference and in the data set. If this options is not defined a "name + 'Id'" will be used".
     *  - service: the service to get the value of the reference.
     *  - uuidPropertyName: the name for UUID property to get the refence from the service. If this options is not defined a "name + 'Uuid'" will be used".
     *  - name: the name form the property and for search in the service.
     *  - Name: the name for the nested object in the data set. In this object the search of: ID, UUID, and name will be performed.
     *  - otherName: another name for te property name to search in the service.
     *  - createIfNotExists: if it's true and no object ID founded, the system will create with a create if not exists.
     *  - getIdForName: method name for get the ID from name from the service.
     *  - clean: if it's true, the properties uuidPropertyName, name, and Name, will be erased from the data set.
     * 
     * For each reference a check for idPropertyName is performed. If the idPropertyName is not defined, the system will try to get the ID from the service using the uuidPropertyName.
     * If the uuidPropertyName is not defined the the system will try to use the "name" in the service. 
     * But if the "name" is not defined the "Name" as nested object, looking for the Nameid, Name.uuid, or Name.name.  
     * If all of the previus alternatives fail, and the otherName is defined an attempt to looking for name = otherName in the service will be running.
     * If the reference ID is still missing and createIfNotExists is true, the system will try to create the referenced object using:
     *  - the data[Name] object as the first try,
     *  - the {name: data.name} object as the second try, and
     *  - the {name: data.otherName} object as the third and final try.
     * 
     * If all of above fails the reference ID will be not completed.
     */
    references = {};

    /**
     * Holds a list of error for this instance.
     * Wrning, if this is a singleton, this list contains error for all of the threads.
     */
    lastErrors = [];

    /**
     * Gets always the same instance of the service.
     * @returns {Promise[<Child>Service]}
     */
    static singleton() {
        if (!this.singletonInstance) {
            this.singletonInstance = new this();
            this.singletonInstance.init();
        }

        return this.singletonInstance;
    }

    init() {
        let name = this.constructor.name;
        if (name.endsWith('Service')) {
            name = name.substring(0, name.length - 7);
        }

        this.shareObject ||= name;
        this.defaultTranslationContext ||= name.toLocaleLowerCase();
        this.eventName = name;
    }

    /**
     * Gets always the same instance of the service.
     * @param {*} error - the error to store.
     * @returns {*}
     */
    async pushError(error) {
        this.lastErrors.push(error);

        return error;
    }

    async emit(eventSubName, condition, result, ...params) {
        if (condition !== false && this.eventBus && this.eventName) {
            let result1 = await this.eventBus?.$emit(this.eventName + '.' + eventSubName, result, ...params) ?? [];
            let result2 = await this.eventBus?.$emit(eventSubName, this.eventName, result, ...params) ?? [];
            return [...result1, ...result2];
        }
    }

    /**
     * Creates a new transaction for use in queries.
     * @returns {sequelize.Transaction}
     */
    async createTransaction() {
        return this.sequelize.transaction();
    }
    
    /**
     * Completes the references for a data, and, optionally, cleans the value referenced data.
     * @param {object} data - data object to complete the references.
     * @param {boolean} clean - if its true cleans the data object of the value referenced data.
     * @returns {Promise[object]} - the arranged data.
     */
    async completeReferences(data, clean) {
        for (const name in this.references) {
            let reference = this.references[name];
            if (reference.function) {
                await reference.function(data);
                continue;
            }

            if (!reference.service) {
                reference = {service: reference};
            }
                
            if (typeof reference !== 'object') {
                reference = {};
            }

            await this.completeEntityId(data, {name, ...reference, clean});
        }

        return data;
    }

    /**
     * Complete the reference ID for a single entity.
     * @param {object} data - data object to complete the references.
     * @param {object} options - confiiguration for the search and complete the entity ID.
     * @returns {Promise[object]} - the arranged data.
     * 
     * This method is used by the @see completeReferences.
     * For a complete guide refer to @see references documentation.
     * Beside the references documentation options may contains the clean property. If 
     * that property is true after create the reference cleans the data object of 
     * the value referenced data.
     */
    async completeEntityId(data, options) {
        const name = options.name;
        const Name = options.Name ?? ucfirst(name);
        const idPropertyName = options.idPropertyName ?? (lcfirst(Name) + 'Id');
        const uuidPropertyName = options.uuidPropertyName ?? (lcfirst(Name) + 'Uuid');
        if (!data[idPropertyName]) {
            const service = options.service.singleton?
                options.service.singleton():
                options.service;
            const getIdForName = options.getIdForName ?? 'getIdForName';

            if (data[uuidPropertyName] && service.getIdForUuid) {
                data[idPropertyName] = await service.getIdForUuid(data[uuidPropertyName]);
            } else if (typeof data[name] === 'string' && data[name] && service[getIdForName]) {
                data[idPropertyName] = await service[getIdForName](data[name], {skipNoRowsError: true});
            } else {
                if (data[Name] && typeof data[Name] === 'object') {
                    if (data[Name].id) {
                        data[idPropertyName] = data[Name].id;
                    } else if (data[Name].uuid && service.getIdForUuid) {
                        data[idPropertyName] = await service.getIdForUuid(data[Name].uuid);
                    } else if (data[Name].name && service[getIdForName]) {
                        data[idPropertyName] = await service[getIdForName](data[Name].name);
                    }
                }
            }

            if (!data[idPropertyName]) {
                const otherName = options.otherName;
                if (otherName && typeof data[otherName] === 'string' && data[otherName] && service[getIdForName]) {
                    data[idPropertyName] = await service[getIdForName](data[otherName], {skipNoRowsError: true});
                }

                if (!data[idPropertyName] && options.createIfNotExists) {
                    let object;
                    if (typeof data[Name] === 'object' && data[Name]) {
                        object = await service.createIfNotExists(data[Name]);
                    } else if (typeof data[Name] === 'string' && data[Name]) {
                        object = await service.createIfNotExists({name: data[Name]});
                    } else if (typeof data[name] === 'string' && data[name]) {
                        object = await service.createIfNotExists({name: data[name]});
                    } else if (typeof data[otherName] === 'string' && data[otherName]) {
                        object = await service.createIfNotExists({name: data[otherName]});
                    }

                    if (object) {
                        data[idPropertyName] = object?.id;
                    } else {
                        let list;
                        if (Array.isArray(data[Name]) && data[Name].length) {
                            list = data[Name];
                        } else if (Array.isArray(data[name]) && data[name].length) {
                            list = data[name];
                        } else if (Array.isArray(data[otherName]) && data[otherName].length) {
                            list = data[otherName];
                        }

                        if (list?.length) {
                            const id = [];
                            for (const item of list) {
                                id.push((await service.createIfNotExists({name: item})).id);
                            }
                            
                            data[idPropertyName] = id;
                        }
                    }
                }
            }
        }

        if (options.clean && data[idPropertyName]) {
            delete data[uuidPropertyName];
            delete data[Name];
            delete data[name];
        }
        
        return data;
    }

    /**
     * Performs the necesary validations.
     * @param {object} data - data to update in entity.
     * @param {string} operation - any of values: creation, update or delete.
     * @returns {Promise[data]} - the data.
     */
    // eslint-disable-next-line no-unused-vars
    async validate(data, operation) {
        return trim(data);
    }

    /**
     * Performs the necesary validations before creation.
     * @param {object} data - data to update in entity.
     * @returns {Promise[data]} - the data.
     */
    async validateForCreation(data) {
        return this.validate(data, 'creation');
    }

    /**
     * Creates a new row into DB.
     * @param {object} data - data for the new row.
     * @param {object} options - options to pass to creator, for use transacion.
     * @returns {Promise[row]}
     */
    async create(data, options) {
        await this.completeReferences(data, true);
        data = await this.validateForCreation(data);

        let transaction;
        if (options?.transaction || this.transaction) {
            if (options.transaction === true || !options.transaction) {
                options.transaction = transaction = await this.createTransaction();
            }
        }

        try {
            await this.emit('creating', options?.emitEvent, data, options, this);
            const row = await this.model.create(data, options);
            await this.emit('created', options?.emitEvent, row, data, options, this);

            await transaction?.commit();

            return row;
        } catch (error) {
            await transaction?.rollback();

            await this.pushError(error);

            throw error;
        }
    }

    /**
     * Gets the options to use in getList methos.
     * @param {object} options - options for the getList method.
     * @returns {Promise[object]}
     * 
     * Common properties:
     * - view: show visible peoperties.
     */
    async getListOptions(options) {
        options ??= {};

        const searchColumns = this.searchColumns = options.searchColumns || this.searchColumns;
        if (options.q && searchColumns) {
            if (!this.Sequelize?.Op) {
                throw new _Error(loc._f('No Sequalize.Op defined on %s. Try adding "Sequelize = conf.global.Sequelize" to the class.', this.constructor.name));
            }
            
            const Op = this.Sequelize.Op;
            const q = `%${options.q}%`;
            const qColumns = [];
            for (const searchColumn of searchColumns) {
                qColumns?.push({[searchColumn]: {[Op.like]: q}});
            }

            const qWhere = {[Op.or]: qColumns};
            if (options.where) {
                options.where = {[Op.and]: [options.where, qWhere]};
            } else {
                options.where = qWhere;
            }
        }

        arrangeOptions(options, this.sequelize);

        return options;
    }

    /**
     * Gets a list of rows.
     * @param {object} options - options for the @see sequelize.findAll and @see getListOptions methods.
     * @returns {Promise[Array[row]]}
     */
    async getList(options) {
        options = await this.getListOptions(options);
        await this.emit('getting', options?.emitEvent, options, this);
        let result;
        if (options.withCount) {
            result = this.model.findAndCountAll(options);
        } else {
            result = this.model.findAll(options);
        }

        await this.emit('getted', options?.emitEvent, result, options, this);

        return result;
    }

    /**
     * Gets a list of rows and the total rows count.
     * @param {Options} options - options for the @see sequelize.findAndCountAll and @see getListOptions methods.
     * @returns {Promise[{Array[row], count}]}
     */
    async getListAndCount(options) {
        return this.getList({...options, withCount: true});
    }

    /**
     * Gets a single row from a row list. If there are no rows or are many rows 
     * this function fails.
     * @param {Array[row]} rows - row list 
     * @param {object} options 
     * @returns row
     * 
     * For an empty list this function throw a NoRowsError exception. But the 
     * exception is skipped if the option skipNoRowsError is specified.
     * 
     * For a list with more than a item a ManyRowsError exception will be thrown.
     * This behavior can be skipped with option skipManyRowsError.
     * 
     * Options: 
     * - skipNoRowsError: if is true the exception NoRowsError will be omitted.
     * - skipManyRowsError: if is true the exception ManyRowsError will be omitted.
     */
    async getSingleFromRows(rows, options) {
        if (rows.then) {
            rows = await rows;
        }

        if (rows.length === 1) {
            return rows[0];
        }

        if (!rows.length) {
            if (options?.skipNoRowsError) {
                return;
            }
            
            throw new NoRowsError();
        }
        
        if (options?.skipManyRowsError) {
            return rows[0];
        }

        return new ManyRowsError({length: rows.length});
    }

    /**
     * Gets a row for a given criteria.
     * @param {object} where - criteria to get the row list (where object).
     * @param {object} options - Options for the @ref getList method.
     * @returns {Promise[Array[row]]}
     */
    async getFor(where, options) {
        return this.getList({...options, where: {...options?.where, ...where}});
    }

    /**
     * Gets a single row for a given criteria in options.
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     */
    async getSingle(options) {
        const rows = await this.getList({limit: 2, ...options});
        return this.getSingleFromRows(rows, options);
    }

    /**
     * Gets a single row for a given criteria.
     * @param {object} where - criteria to get the row list (where object).
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     */
    async getSingleFor(where, options) {
        return this.getSingle({...options, where: {...options?.where, ...where}});
    }

    async count(options) {
        options = await this.getListOptions(options);
        await this.emit('gettingCount', options?.emitEvent, options);
        const result = this.model.count(options);
        await this.emit('gettingCount', options?.emitEvent, result, options);

        return result;
    }

    async countFor(where, options) {
        return this.count({...options, where: {...options?.where, ...where}});
    }

    /**
     * Performs the necesary validations before updating.
     * @param {object} data - data to update in entity.
     * @returns {Promise[data]} - the data.
     */
    async validateForUpdate(data, where) {
        return this.validate(data, 'update', where);
    }

    /**
     * Updates rows for options.
     * @param {object} data - Data to update.
     * @param {object} options - object with the where property for criteria to update and the transaction object.
     * @returns {Promise[integer]} updated rows count.
     */
    async update(data, options) {
        await this.completeReferences(data);
        data = await this.validateForUpdate(data, options.where);

        await this.emit('updating', options?.emitEvent, data, options, this);
        const result = await this.model.update(data, options);
        await this.emit('updated', options?.emitEvent, result, data, options, this);

        return result;
    }

    /**
     * Updates row for a criteria.
     * @param {object} data - Data to update.
     * @param {object} where - where object with the criteria to update.
     * @param {object} options - object for transaction.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateFor(data, where, options) {
        return this.update(data, {...options, where: {...options?.where, ...where}});
    }

    /**
     * Deletes rows for options.
     * @param {object} options - object with the where property for criteria to delete and the transaction object.
     * @returns {Promise[integer]} deleted rows count.
     */
    async delete(options) {        
        await this.completeReferences(options.where, true);

        await this.emit('deleting', options?.emitEvent, options, this);
        const result = await this.model.destroy(options);
        await this.emit('deleted', options?.emitEvent, result, options, this);

        return result;
    }

    /**
     * Deletes rows for a criteria.
     * @param {object} where - where object with the criteria to delete.
     * @param {object} options - object for transaction.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteFor(where, options) {        
        return this.delete({...options, where: {...options?.where, ...where}});
    }
}