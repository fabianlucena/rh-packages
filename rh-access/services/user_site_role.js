import {conf} from '../conf.js';
import {ServiceSharedEnable} from 'rf-service';
import {addEnabledOwnerModuleFilter, MissingPropertyError, checkDataForMissingProperties, skipAssociationAttributes, completeIncludeOptions, getIncludedModelOptions} from 'sql-util';
import {complete} from 'rf-util';

export class UserSiteRoleService extends ServiceSharedEnable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.UserSiteRole;
    references = {
        user: {
            service: conf.global.services.User,
            getIdForName: 'getIdForUsername',
            otherName: 'username',
        },
        site: conf.global.services.Site,
        role: conf.global.services.Role,
    };
    defaultTranslationContext = 'userSiteRole';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'UserSiteRole', 'userId', 'siteId', 'roleId');

        return true;
    }

    async getListOptions(options) {
        if (options.isEnabled !== undefined) {
            options = addEnabledOwnerModuleFilter(options, conf.global.models.Module);
            options.where ??= {};
            options.where.isEnabled = options.isEnabled;
        }

        if (!options.attributes) {
            if (options.view) {
                options.attributes = ['isEnabled'];
            }
        }
        
        let autoGroup;
        if (options.includeRole || options.where?.userUuid) {
            const attributes = options.includeRole?.attributes ??
                options.includeRole?
                ['uuid', 'name', 'title', 'isTranslatable', 'isEnabled']:
                [];
            
            let where;
            if (options.where?.roleUuid) {
                where = {uuid: options.where.roleUuid};
                delete options.where.roleUuid;
            }

            completeIncludeOptions(
                options,
                'Role',
                options.includeRole,
                {
                    model: conf.global.models.Role,
                    attributes,
                    where,
                }
            );

            delete options.includeRole;
        } else if (!getIncludedModelOptions(options, conf.global.models.Role)) {
            autoGroup = [];
        }

        if (autoGroup) {
            if (!options.attributes.includes('userId')) {
                autoGroup.push('UserSiteRole.userId');
            }

            options.attributes.forEach(column => autoGroup.push('UserSiteRole.' + column));
        }

        if (options.includeUser || options.where?.userUuid) {
            const attributes = options.includeUser?.attributes ??
                options.includeUser?
                ['uuid', 'username', 'displayName', 'isTranslatable', 'isEnabled']:
                [];
            
            let where;
            if (options.where?.userUuid) {
                where = {uuid: options.where.userUuid};
                delete options.where.userUuid;
            }

            completeIncludeOptions(
                options,
                'User',
                options.includeUser,
                {
                    model: conf.global.models.User,
                    attributes,
                    where,
                }
            );

            delete options.includeUser;

            if (autoGroup) {
                if (!attributes.includes('id')) {
                    autoGroup.push('User.id');
                }

                attributes.forEach(column => autoGroup.push('User.' + column));
            }
        }

        if (options.includeSite || options.where?.siteUuid) {
            const attributes = options.includeUser?.attributes ??
                options.includeSite?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];
                
            let where;
            if (options.where?.siteUuid) {
                where = {uuid: options.where.siteUuid};
                delete options.where.siteUuid;
            }

            completeIncludeOptions(
                options,
                'Site',
                options.includeSite,
                {
                    model: conf.global.models.Site,
                    attributes,
                    where,
                }
            );

            delete options.includeSite;

            if (autoGroup) {
                if (!attributes.includes('id')) {
                    autoGroup.push('Site.id');
                }
                
                attributes.forEach(column => autoGroup.push('Site.' + column));
            }
        }

        if (autoGroup?.length) {
            options.group = [...new Set((options.group ?? []).concat(autoGroup))];
        }
        
        if (!options.order && getIncludedModelOptions(options, conf.global.models.User)) {
            options.order ??= [];
            options.order.push(['User.username', 'ASC']);
        }

        return super.getListOptions(options);
    }

    async getUserIdForUserUuid(uuid, options) {
        const userSiteRole = await this.getSingleFor({userUuid: uuid}, {...options, limit: 1});
        return userSiteRole?.userId;
    }

    /**
     * Enables a row for a given site ID and user ID.
     * @param {string} siteId - ID for the site to enable.
     * @param {string} userId - ID for the user to enable.
     * @returns {Promise[integer]} enabled rows count.
     */
    async enableForSiteIdAndUserId(siteId, userId, options) {
        return await this.updateFor({isEnabled: true}, {siteId, userId}, options);
    }

    /**
     * Disables a row for a given site ID and user ID.
     * @param {string} siteId - ID for the site to disable.
     * @param {string} userId - ID for the user to disable.
     * @returns {Promise[integer]} disabled rows count.
     */
    async disableForSiteIdAndUserId(siteId, userId, options) {
        return await this.updateFor({isEnabled: false}, {siteId, userId}, options);
    }

    /**
     * Creates a new UserSiteRole row into DB if not exists.
     * @param {data} data - data for the new UserSiteRole.
     * @returns {Promise{UserSiteRole}}
     */
    async createIfNotExists(data, options) {
        options = {...options, attributes: ['userId', 'siteId', 'roleId'], where: {}, include: [], limit: 1};

        if (data.userId) {
            options.where.userId = data.userId;
        } else if (data.user || data.username || data.name) {
            options.include.push(complete({model: conf.global.models.User, where: {username: data.user ?? data.username ?? data.name}}, skipAssociationAttributes));
        } else {
            throw new MissingPropertyError('UserSiteRole', 'user', 'userId');
        }
        
        if (data.siteId) {
            options.where.siteId = data.siteId;
        } else if (data.site) {
            options.include.push(complete({model: conf.global.models.Site, where: {name: data.site}}, skipAssociationAttributes));
        } else {
            throw new MissingPropertyError('UserSiteRole', 'site', 'siteId');
        }

        if (data.roleId) {
            options.where.roleId = data.roleId;
        } else if (data.role) {
            options.include.push(complete({model: conf.global.models.Role, where: {name: data.role}}, skipAssociationAttributes));
        } else {
            throw new MissingPropertyError('UserSiteRole', 'role', 'roleId');
        }

        const rowList = await this.getList(options);
        if (rowList.length) {
            return rowList[0];
        }

        return this.create(data);
    }

    async delete(options) {
        await this.completeReferences(options.where, true);

        const where = options.where;
        if (where?.notRoleId) {
            const Op = conf.global.Sequelize.Op;
            const condition = {[Op.notIn]: where.notRoleId};
            if (where.roleId) {
                where.roleId = {[Op.and]: [where.roleId, condition]};
            } else {
                where.roleId = condition;
            }

            delete where.notRoleId;
        }

        return conf.global.models.UserSiteRole.destroy(options);
    }
}