'use strict';

import {NoRowsError, ManyRowsError} from './rf-service-errors.js';
import {ucfirst, lcfirst} from 'rf-util/rf-util-string.js';

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

    static singleton() {
        if (!this.singletonInstance)
            this.singletonInstance = new this();

        return this.singletonInstance;
    }

    async pushError(error) {
        this.lastErrors.push(error);
    }

    async createTransaction() {
        return this.sequelize.transaction();
    }
    
    async completeReferences(data, clean) {
        for (const name in this.references) {
            let reference = this.references[name];
            if (reference.function) {
                await reference.function(data);
                continue;
            }

            if (!reference.service)
                reference = {service: reference};
                
            if (typeof reference !== 'object')
                reference = {};

            await this.completeEntityId(data, {name, ...reference, clean});
        }

        return data;
    }

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

            if (data[uuidPropertyName] && service.getIdForUuid)
                data[idPropertyName] = await service.getIdForUuid(data[uuidPropertyName]);
            else if (typeof data[name] === 'string' && data[name] && service[getIdForName])
                data[idPropertyName] = await service[getIdForName](data[name], {skipNoRowsError: true});
            else {
                if (data[Name] && typeof data[Name] === 'object') {
                    if (data[Name].id)
                        data[idPropertyName] = data[Name].id;
                    else if (data[Name].uuid && service.getIdForUuid)
                        data[idPropertyName] = await service.getIdForUuid(data[Name].uuid);
                    else if (data[Name].name && service[getIdForName])
                        data[idPropertyName] = await service[getIdForName](data[Name].name);
                }
            }

            if (!data[idPropertyName]) {
                const otherName = options.otherName;
                if (otherName && typeof data[otherName] === 'string' && data[otherName] && service[getIdForName])
                    data[idPropertyName] = await service[getIdForName](data[otherName], {skipNoRowsError: true});

                if (!data[idPropertyName] && options.createIfNotExists) {
                    let object;
                    if (typeof data[Name] === 'object' && data[Name])
                        object = await service.createIfNotExists(data[Name]);
                    else if (typeof data[name] === 'string' && data[name])
                        object = await service.createIfNotExists({name: data[name]});
                    else if (typeof data[otherName] === 'string' && data[otherName])
                        object = await service.createIfNotExists({name: data[otherName]});

                    if (object)
                        data[idPropertyName] = object?.id;
                }
            }
        }

        if (options.clean) {
            delete data[uuidPropertyName];
            delete data[Name];
            delete data[name];
        }
        
        return data;
    }

    /**
     * Creates a new row into DB.
     * @param {object} data - data for the new row.
     * @returns {Promise[row]}
     */
    async create(data, options) {
        await this.completeReferences(data, true);
        await this.validateForCreation(data);

        let transaction;
        if (options?.transaction) {
            if (options.transaction === true)
                options.transaction = transaction = await this.createTransaction();
        }

        try {
            const row = await this.model.create(data, options);

            await transaction?.commit();

            return row;
        } catch (error) {
            await transaction?.rollback();

            this.pushError(error);

            throw error;
        }
    }

    async getListOptions(options) {
        if (!options)
            options = {};

        return options;
    }

    /**
     * Gets a list of rows.
     * @param {object} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise[Array[row]]}
     */
    async getList(options) {
        options = await this.getListOptions(options);
        if (options.withCount)
            return this.model.findAndCountAll(options);
        else
            return this.model.findAll(options);
    }

    /**
     * Gets a list of rows and the total rows count.
     * @param {Options} options - options for the @see sequelize.findAndCountAll method.
     *  - view: show visible peoperties.
     * @returns {Promise[{Array[row], count}]}
     */
    async getListAndCount(options) {
        return this.getList({...options, withCount: true});
    }

    async translateRows(rows, loc) {
        return Promise.all(rows.map(row => this.translateRow(row, loc)));
    }

    async translateRow(row, loc) {
        if (row.toJSON)
            row = row.toJSON();

        if (row.createdAt)
            row.createdAt = await loc.strftime('%x %R', row.createdAt);

        if (row.updatedAt)
            row.updatedAt = await loc.strftime('%x %R', row.updatedAt);

        if (row.isTranslatable) {
            const translationContext = row.translationContext ?? this.defaultTranslationContext ?? null;
            if (row.title)
                row.title = await loc._c(translationContext, row.title);

            if (row.description)
                row.description = await loc._c(translationContext, row.description);
        }
        delete row.isTranslatable;

        return row;
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
        if (rows.then)
            rows = await rows;

        if (rows.length === 1)
            return rows[0];

        if (!rows.length) {
            if (options?.skipNoRowsError)
                return;
            
            throw new NoRowsError();
        }
        
        if (options?.skipManyRowsError)
            return rows[0];

        return new ManyRowsError({length: rows.length});
    }

    /**
     * Gets a row for a given criteria.
     * @param {object} where - criteria to get the row list.
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[Array[row]]}
     */
    async getFor(where, options) {
        return this.getList({...options, where: {...options?.where, ...where}});
    }

    /**
     * Gets a single row for a given criteria in options.
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[Array[row]]}
     */
    async getSingle(options) {
        const rows = this.getList({limit: 2, ...options});
        return this.getSingleFromRows(rows, options);
    }

    /**
     * Gets a single row for a given criteria.
     * @param {object} where - criteria to get the row list.
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[Array[row]]}
     */
    async getSingleFor(where, options) {
        return this.getSingle({...options, where: {...options?.where, ...where}});
    }

    /**
     * Creates a new row into DB if not exists.
     * @param {data} data - data for the row @see create.
     * @returns {Promise[row]}
     */
    async createIfNotExists(data, options) {
        const row = await this.getForName(data.name, {skipNoRowsError: true, ...options});
        if (row)
            return row;

        return this.create(data);
    }

    /**
     * Updates a row for a given criteria.
     * @param {object} data - Data to update.
     * @param {object} where - Where object with the criteria to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async update(data, options) {
        await this.completeReferences(data);

        return this.model.update(data, options);
    }

    /**
     * Updates a row for a given criteria.
     * @param {object} data - Data to update.
     * @param {object} where - Where object with the criteria to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateFor(data, where, options) {
        await this.completeReferences(data);

        return this.model.update(data, {...options, where: {...options?.where, ...where}});
    }

    /**
     * Deletes a row for a given criteria.
     * @param {object} where - Where object with the criteria to delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async delete(options) {        
        await this.completeReferences(options.where, true);

        if (this.shareService && this.shareObject) {
            const id = await this.getIdFor(options.where);
            await this.shareService.deleteForObjectNameAndId(this.shareObject, id);
        }

        return this.model.destroy(options);
    }

    /**
     * Deletes a row for a given criteria.
     * @param {object} where - Where object with the criteria to delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteFor(where, options) {        
        return this.delete({...options, where: {...options?.where, ...where}});
    }
}