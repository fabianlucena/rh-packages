'use strict';

import {RoleService} from './role.js';
import {UserSiteRoleService} from './user_site_role.js';
import {conf} from '../conf.js';
import {getIncludedModelOptions, completeIncludeOptions, MissingPropertyError} from 'sql-util';
import {CheckError} from 'rf-util';
import {loc} from 'rf-locale';

export class MemberService extends conf.global.services.User {
    constructor() {
        super();
        this.roleService = RoleService.singleton();
        this.userSiteRoleService = UserSiteRoleService.singleton();
    }

    async validateForCreation(data) {
        await super.validateForCreation(data);

        if (!data.rolesId?.length) {
            if (data.rolesUuid?.length)
                data.rolesId = await this.roleService.getIdForUuid(data.rolesUuid);

            if (!data.rolesId?.length)
                throw new MissingPropertyError('Member', 'roles');
        }
        
        return true;
    }

    async create(data) {
        const transaction = await this.createTransaction();
        try {
            const createOptions = {transaction};

            const user = await super.create(data, createOptions);
            const userId = user.id;
            const siteId = data.siteId;

            const options = {
                attributes: ['userId'],
                where: {
                    userId,
                    siteId,
                },
                raw: true,
                nest: true,
            };

            const rolesId = [];
            await Promise.all(await data.rolesId.map(async roleId => {
                if (!data.assignableRolesId || data.assignableRolesId.includes(roleId)) {
                    rolesId.push(roleId);
                    options.where.roleId = roleId;
                    const result = await this.userSiteRoleService.getList(options);
                    if (!result?.length) {
                        await this.userSiteRoleService.create({
                            userId,
                            siteId,
                            roleId,
                        }, createOptions);
                    }
                }
            }));

            await transaction.commit();

            user.rolesId = rolesId;

            return user;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getListOptions(options) {
        if (options.check !== false) {
            if (!options?.where?.siteId)
                throw new CheckError(loc._cf('member', 'Missing Site ID parameter.'));
        }

        options = await super.getListOptions(options);

        if (options?.where?.siteId) {
            let siteOptions = getIncludedModelOptions(options, conf.global.models.Site);
            if (!siteOptions) {
                options.include ??= [];
                siteOptions = {
                    model: conf.global.models.Site,
                    attributes: [],
                };
        
                options.include.push(siteOptions);
            }

            siteOptions.where ??= {};
            siteOptions.where.id = options.where.siteId;

            delete options.where.siteId;
        }

        if (options.includeRoles) {
            const where = {isEnabled: true};
            if (options.includeRolesId)
                where.id = options.includeRolesId;
            
            completeIncludeOptions(
                options,
                'Role',
                {
                    model: conf.global.models.Role,
                    attributes: ['uuid', 'title', 'description'],
                    skipThroughAssociationAttributes: true,
                    where,
                }
            );

            delete options.includeRoles;
        }

        return options;
    }
}