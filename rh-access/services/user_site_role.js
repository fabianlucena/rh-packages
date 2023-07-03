'use strict';

import {conf} from '../conf.js';
import {ServiceBase} from 'rf-service';
import {addEnabledOnerModuleFilter, MissingPropertyError, checkDataForMissingProperties, skipAssociationAttributes, completeIncludeOptions, arrangeOptions} from 'sql-util';
import {complete} from 'rf-util';

export class UserSiteRoleService extends ServiceBase {
    sequelize = conf.global.sequelize;
    model = conf.global.models.UserSiteRole;
    references = {
        user: conf.global.services.User,
        site: conf.global.services.Site,
        role: conf.global.services.Role,
    };
    defaultTranslationContext = 'userSiteRole';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId', 'roleId');

        return true;
    }

    async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid'];
        }

        if (options.includeUser) {
            completeIncludeOptions(
                options,
                'User',
                options.includeUser,
                {
                    model: conf.global.models.User,
                    attributes: options.view? ['uuid', 'username', 'displayName', 'isTranslatable']: null
                }
            );

            delete options.includeUser;
        }
        

        if (options.includeSite) {
            completeIncludeOptions(
                options,
                'Site',
                options.includeSite,
                {
                    model: conf.global.models.Site,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );

            delete options.includeSite;
        }

        if (options.includeRole) {
            completeIncludeOptions(
                options,
                'Role',
                options.includeRole,
                {
                    model: conf.global.models.Role,
                    attributes: options.view? ['uuid', 'name', 'title', 'isTranslatable']: null
                }
            );

            delete options.includeRole;
        }

        arrangeOptions(options, conf.global.sequelize);

        return options;
    }

    /**
     * Creates a new UserSiteRole row into DB if not exists.
     * @param {data} data - data for the new UserSiteRole.
     * @returns {Promise{UserSiteRole}}
     */
    async createIfNotExists(data, options) {
        options = {...options, attributes: ['userId', 'siteId', 'roleId'], where: {}, include: [], limit: 1};

        if (data.userId)
            options.where.userId = data.userId;
        else if (data.user || data.username || data.name)
            options.include.push(complete({model: conf.global.models.User, where: {username: data.user ?? data.username ?? data.name}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'user', 'userId');
        
        if (data.siteId)
            options.where.siteId = data.siteId;
        else if (data.site)
            options.include.push(complete({model: conf.global.models.Site, where: {name: data.site}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'site', 'siteId');

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(complete({model: conf.global.models.Role, where: {name: data.role}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('UserSiteRole', 'role', 'roleId');

        const rowList = await this.getList(options);
        if (rowList.length)
            return rowList[0];

        return this.create(data);
    }

    async delete(where, options) {
        const Op = conf.global.Sequelize.Op;

        if (where?.userUuid && !where.userId) {
            where.userId = await conf.global.services.User.singleton().getIdForUuid(where.userUuid);
            delete where.userUuid;
        }

        if (where?.siteUuid && !where.siteId) {
            where.siteId = await conf.global.services.Site.singleton().getIdForUuid(where.siteUuid);
            delete where.siteUuid;
        }

        if (where?.roleUuid && !where.roleId) {
            where.roleId = await conf.global.services.Role.getIdForUuid(where.roleUuid);
            delete where.roleUuid;
        }

        if (where?.notRoleId) {
            const condition = {[Op.notIn]: where.notRoleId};
            if (where.roleId)
                where.roleId = {[Op.and]: [where.roleId, condition]};
            else
                where.roleId = condition;

            delete where.notRoleId;
        }

        return conf.global.models.UserSiteRole.destroy({...options, where: {...options?.where, ...where}});
    }
}