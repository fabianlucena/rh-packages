'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {
    addEnabledFilter,
    addEnabledOnerModuleFilter, 
    checkDataForMissingProperties,
    getIncludedModelOptions,
    getSingle,
    completeAssociationOptions
} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull, complete} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class SiteService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Site;
    references = {
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'site';

    async validateForCreation(data) {
        if (data.id)
            throw new CheckError(loc._cf('site', 'ID parameter is forbidden for creation.'));

        
        await checkDataForMissingProperties(data, 'Site', 'name', 'title');

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('site', 'Name'));
        checkParameterStringNotNullOrEmpty(data.title, loc._cf('site', 'Title'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {skipNoRowsError: true}))
            throw new ConflictError(loc._cf('site', 'Exists another test site with that name.'));

        if (!data.owner && !data.ownerId)
            throw new CheckError(loc._cf('site', 'No owner specified.'));

        return true;
    }

    async getListOptions(options) {
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'name', 'title'];

            const includedUserOptions = getIncludedModelOptions(options, conf.global.models.User);
            if (includedUserOptions) {
                if (!includedUserOptions.attributes) {
                    includedUserOptions.attributes = [];
                }
            }
        }

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets the site for a given session ID.
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    async getForSessionId(sessionId, options) {
        options = complete(options, {include: [], limit: 2});
        options.include.push(completeAssociationOptions({model: conf.global.models.Session, where: {id: sessionId}}, options));

        const rowList = await this.getList(options);
        return getSingle(rowList, {params: ['site', ['session id = %s', sessionId], 'Site'], ...options});
    }
    /**
     * Gets a site list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    getForUsername(username, options) {
        options.include ??= [];       
        options.include.push(completeAssociationOptions({model: conf.global.models.User, where: {username}}, options));

        return this.getList(options);
    }

    /**
     * Gets a site name list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    getNameForUsername(username, options) {
        if (!username)
            return [];

        return this.getForUsername(username, {...options, attributes: ['name'], skipThroughAssociationAttributes: true})
            .then(async list => list.map(role => role.name));
    }
}