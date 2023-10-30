import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledModuleTranslatable} from 'rf-service';
import {getIncludedModelOptions, getSingle, completeAssociationOptions} from 'sql-util';

export class SiteService extends ServiceIdUuidNameEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Site;
    moduleModel = conf.global.models.Module;
    defaultTranslationContext = 'site';

    async getListOptions(options) {
        if (options?.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'name', 'title'];
            }

            const includedUserOptions = getIncludedModelOptions(options, conf.global.models.User);
            if (includedUserOptions) {
                if (!includedUserOptions.attributes) {
                    includedUserOptions.attributes = [];
                }
            }
        }

        return super.getListOptions(options);
    }

    /**
     * Gets the site for a given session ID.
     * @param {integer} sessionId - session ID to retrieve the site.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Site}}
     */
    async getForSessionId(sessionId, options) {
        options = {...options, include: [], limit: 2};
        options.include.push(completeAssociationOptions({model: conf.global.models.Session, where: {id: sessionId}}, options));

        const rowList = await this.getList(options);
        return getSingle(rowList, {params: ['site', ['session id = %s', sessionId], 'Site'], ...options});
    }

    /**
     * Gets a site list for an user ID.
     * @param {string} userId - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    async getForUserId(userId, options) {
        options ??= {};
        options.include ??= [];       
        options.include.push(completeAssociationOptions({model: conf.global.models.User, where: {id: userId}}, options));

        return this.getList(options);
    }

    /**
     * Gets a site list for an user with the username.
     * @param {string} username - 
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]Site]}}
     */
    async getForUsername(username, options) {
        options ??= {};
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
    async getNameForUsername(username, options) {
        if (!username) {
            return [];
        }

        return this.getForUsername(username, {...options, attributes: ['name'], skipThroughAssociationAttributes: true})
            .then(async list => list.map(role => role.name));
    }
}