'use strict';

import {NoRowsError, ManyRowsError, NoRowError, DisabledRowError} from './rf-service-errors.js';
import {ucfirst} from 'rf-util/rf-util-string.js';

export class Service {
    references = {};

    static singleton() {
        if (!this.singletonInstance)
            this.singletonInstance = new this();

        return this.singletonInstance;
    }
    
    async completeReferences(data, clean) {
        for (const name in this.references)
            await this.completeEntityId(data, this.references[name], name, clean);

        return data;
    }

    async completeEntityId(data, service, name, clean) {
        const idParamName = name + 'Id';
        const uuidParamName = name + 'Uuid';
        const Name = ucfirst(name);
        if (!data[idParamName]) {
            if (data[uuidParamName])
                data[idParamName] = await service.getIdForUuid(data[uuidParamName]);
            else if (typeof data[name] === 'string' && data[name])
                data[idParamName] = await service.getIdForName(data[name]);
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
        
        }

        if (clean) {
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
            const testCase = await this.model.create(data, {transaction});
            if (this.shareObject && this.shareService && (data.userId || data.user)) {
                await this.addCollaborator(
                    {
                        objectId: testCase.id,
                        userId: data.ownerId,
                        user: data.owner,
                        type: 'owner',
                    },
                    transaction
                );
            }

            return testCase;
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
            result = this.model.findAndCountAll(await this.getListOptions(options));
        else
            result = this.model.findAll(await this.getListOptions(options));

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
            if (row.title)
                row.title = await loc._(row.title);

            if (row.description)
                row.description = await loc._(row.description);
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
    async getSingle(rows, options) {
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
        return this.getList({...options, where: {...where, ...options?.where}, });
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
            return this.getList({...options, where: {id, ...options?.where}, });
            
        const rows = this.getList({limit: 2, ...options, where: {id, ...options?.where}, });

        return this.getSingle(rows, options);
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
            return this.getList({...options, where: {uuid, ...options?.where}, });
            
        const rows = this.getList({limit: 2, ...options, where: {uuid, ...options?.where}, });

        return this.getSingle(rows, options);
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
        if (Array.isArray(name))
            return this.getList({...options, where: {name, ...options?.where}});
            
        const rows = this.getList({limit: 2, ...options, where: {name, ...options?.where}});

        return this.getSingle(rows, options);
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
        return (await this.getForName(where, {attributes: ['id'], ...options})).map(row => row.id);
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
        
        return (await this.getForName(name, {attributes: ['id'], ...options})).id;
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
     * @param {object} where - Where objct with the criteria to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async update(data, where) {
        await this.completeReferences(data);

        return this.model.update(data, where);
    }

    /**
     * Updates a row for a given UUID.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise[integer]} updated rows count.
     */
    async updateForUuid(data, uuid) {
        return this.update(data, {where: {uuid}});
    }

    /**
     * Deletes a row for a given criteria.
     * @param {object} where - Where objct with the criteria to delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async delete(where) {        
        await this.completeReferences(where, true);

        if (this.shareService && this.shareObject) {
            const id = await this.getIdFor(where);
            await this.shareService.deleteForObjectNameAndId(this.shareObject, id);
        }

        return this.model.destroy({where});
    }

    /**
     * Deletes a rows for a given UUID.
     * @param {string} uuid - UUID for the test case o delete.
     * @returns {Promise[integer]} deleted rows count.
     */
    async deleteForUuid(uuid) {
        return this.delete({where: {uuid}});
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