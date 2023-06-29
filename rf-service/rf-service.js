'use strict';

import {NoRowsError, ManyRowsError, NoRowError, DisabledRowError} from './rf-service-errors.js';
import {ucfirst} from 'rf-util/rf-util-string.js';
import {loc} from 'rf-locale';

export class Service {
    references = {};

    static singleton() {
        if (!this.singletonInstance)
            this.singletonInstance = new this();

        return this.singletonInstance;
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
        const idParamName = options.idParamName ?? (name + 'Id');
        const uuidParamName = options.uuidParamName ?? (name + 'Uuid');
        if (!data[idParamName]) {
            const service = options.service.singleton?
                options.service.singleton():
                options.service;

            if (data[uuidParamName])
                data[idParamName] = await service.getIdForUuid(data[uuidParamName]);
            else if (typeof data[name] === 'string' && data[name])
                data[idParamName] = await service.getIdForName(data[name], {skipNoRowsError: true});
            else {
                if (data[Name] && typeof data[Name] === 'object') {
                    if (data[Name].id)
                        data[idParamName] = data[Name].id;
                    else if (data[Name].uuid)
                        data[idParamName] = await service.getIdForUuid(data[Name].uuid);
                    else if (data[Name].name)
                        data[idParamName] = await service.getIdForName(data[Name].name);
                }
            }

            if (!data[idParamName]) {
                const otherName = options.otherName;
                if (otherName && typeof data[otherName] === 'string' && data[otherName])
                    data[idParamName] = await service.getIdForName(data[otherName], {skipNoRowsError: true});

                if (!data[idParamName] && options.createIfNotExists) {
                    if (typeof data[name] === 'string' && data[name]) {
                        const object = await service.createIfNotExists({name: data[name]});
                        data[idParamName] = object?.id;
                    } else if (typeof data[otherName] === 'string' && data[otherName]) {
                        const object = await service.createIfNotExists({name: data[otherName]});
                        data[idParamName] = object?.id;
                    }
                }
            }
        }

        if (options.clean) {
            delete data[uuidParamName];
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
    async create(data) {
        await this.completeReferences(data);
        await this.validateForCreation(data);
        
        return await this.sequelize.transaction(async transaction => {
            const row = await this.model.create(data, {transaction});
            if (this.shareObject && this.shareService && (data.userId || data.user)) {
                await this.addCollaborator(
                    {
                        objectId: row.id,
                        userId: data.ownerId,
                        user: data.owner,
                        type: 'owner',
                    },
                    transaction
                );
            }

            return row;
        });
    }

    /**
     * Add a collaborator for a object ID.
     * @param {object} data - ID for the collaborator.
     * @param {object} transaction - transaction object.
     * @returns {Promise[row]}
     */
    async addCollaborator(data, transaction) {
        if (!this.shareObject || !this.shareService || (!data.userId && !data.user))
            return;

        return this.shareService.create(data, {transaction});
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
        let result;
        if (options.withCount)
            result = this.model.findAndCountAll(options);
        else
            result = this.model.findAll(options);

        let loc;
        if (options.translate !== false)
            loc = options.loc;

        if (loc) {
            result = await result;
            if (options.withCount)
                result.rows = await this.translateRows(result.rows, loc);
            else
                result = await this.translateRows(result, loc);
        } else if (options.translate)
            console.warn('Cannot translate because no localization (loc) defined.');

        return result;
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
     * Gets a row for its ID. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} id - ID for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForId(id, options) {
        if (Array.isArray(id))
            return this.getList({...options, where: {...options?.where, id}});
            
        const rows = await this.getList({limit: 2, ...options, where: {...options?.where, id}});

        return this.getSingleFromRows(rows, options);
    }

    /**
     * Gets a row for its UUID. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} uuid - UUID for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForUuid(uuid, options) {
        if (Array.isArray(uuid))
            return this.getList({...options, where: {...options?.where, uuid}});
            
        return this.getSingleFor({uuid}, options);
    }

    /**
     * Gets a row for its name. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} name - name for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {Promise[row]}
     * 
     * If the name parammeter is a string return a single row or throw an exception.
     * But if the name parameter is a array can return a row list.
     * 
     * This function uses @ref getSingle function so the options for getSingle
     * function can be specified.
     */
    async getForName(name, options) {
        if (name === undefined)
            throw new Error(loc._f('Invalid value for name to get row'));

        if (Array.isArray(name))
            return this.getList({...options, where: {...options?.where, name}});
            
        return await this.getSingleFor({name}, options);
    }

    /**
     * Gets a row ID list for a given criteria.
     * @param {object} where - criteria to get the row list.
     * @param {object} options - Options for the @ref getList function.
     * @returns {Promise[Array[ID]]}
     * 
     * This function uses @ref getFor function so the options for getFor
     * function can be specified.
     */
    async getIdFor(where, options) {
        return (await this.getFor(where, {attributes: ['id'], ...options})).map(row => row.id);
    }

    /**
     * Gets a row ID for its UUID. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} uuid - UUID for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {ID}
     * 
     * If the uuid parammeter is a string return a single ID or throw an exception.
     * But if the name parameter is a array can return a ID list.
     * 
     * This function uses @ref getForUuid function so the options for getForUuid
     * function can be specified.
     */
    async getIdForUuid(name, options) {
        if (Array.isArray(name))
            return (await this.getForUuid(name, {attributes: ['id'], ...options})).map(row => row.id);
        
        return (await this.getForUuid(name, {attributes: ['id'], ...options})).id;
    }

    /**
     * Gets a row ID for its name. For many coincidences and for no rows this 
     * function fails.
     * @param {string|Array} name - name for the row to get.
     * @param {Options} options - Options for the @ref getList function.
     * @returns {ID}
     * 
     * If the name parammeter is a string return a single ID or throw an exception.
     * But if the name parameter is a array can return a ID list.
     * 
     * This function uses @ref getForName function so the options for getForName
     * function can be specified.
     */
    async getIdForName(name, options) {
        if (Array.isArray(name))
            return (await this.getForName(name, {attributes: ['id'], ...options})).map(row => row.id);
        
        const row = await this.getForName(name, {attributes: ['id'], ...options});
        if (!row)
            return;

        return row.id;
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
    * Gets a row ID for its name. For many coincidences this method fails, for no rows this method will creates a newone.
    * @param {string} name - name for the source to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise[ID]}
    */
    async getIdOrCreateForName(name, options) {
        if (Array.isArray(name)) {
            const ids = [];
            for (const thisName of name)
                ids.push((await this.createIfNotExists({name: thisName, title: thisName}, {...options, attributes: ['id']})).id);

            return ids;
        }
        else
            return (await this.createIfNotExists({name, title: name}, {...options, attributes: ['id']})).id;
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
     * Updates a row for a given ID.
     * @param {object} data - Data to update.
     * @param {object} id - ID of the row to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateForId(data, id, options) {
        return this.updateFor(data, {id}, options);
    }

    /**
     * Updates a row for a given UUID.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the row to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateForUuid(data, uuid, options) {
        return this.updateFor(data, {uuid}, options);
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

    /**
     * Deletes a rows for a given ID.
     * @param {string} id - ID for the test case o delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteForId(id) {
        return this.deleteFor({id});
    }
    

    /**
     * Deletes a rows for a given UUID.
     * @param {string} uuid - UUID for the test case o delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteForUuid(uuid) {
        return this.deleteFor({uuid});
    }

    /**
     * Checks for an existent and enabled row. If the row nbot exists or is disabled throws an exception.
     * @param {object} row - test case model object to check.
     * @returns 
     */
    async checkEnabled(row) {
        if (!row)
            throw new NoRowError();

        if (!row.isEnabled)
            throw new DisabledRowError();

        return true;
    }

    /**
     * Enables a row for a given UUID.
     * @param {string} uuid - UUID for the row o enable.
     * @returns {Promise[integer]} enabled rows count.
     */
    async enableForUuid(uuid) {
        return await this.updateForUuid({isEnabled: true}, uuid);
    }

    /**
     * Disables a row for a given UUID.
     * @param {string} uuid - UUID for the row o disable.
     * @returns {Promise[integer]} disabled rows count.
     */
    async disableForUuid(uuid) {
        return await this.updateForUuid({isEnabled: false}, uuid);
    }
}