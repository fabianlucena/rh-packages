'use strict';

import {MemberService} from '../services/member.js';
import {AssignableRolePerRoleService} from '../services/assignable_role_per_role.js';
import {RoleService} from '../services/role.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid, checkParameterUuidList, checkParameterNotNullOrEmpty} from 'rf-util';

const memberService = MemberService.singleton();
const assignableRolePerRoleService = AssignableRolePerRoleService.singleton();
const siteService = conf.global.services.Site.singleton();
const userService = conf.global.services.User.singleton();
const roleService = RoleService.singleton();
const identityService = conf.global.services.Identity.singleton();

export class MemberController {
    static async getUserIdFromUuid(req, uuid) {
        const userId = await memberService.getUserIdForUserUuid(uuid, {where: {siteId: req.site.id}, skipNoRowsError: true});
        if (!userId)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 404, uuid);

        return userId;
    }

    static async get(req, res) {
        if ('$grid' in req.query)
            return this.getGrid(req, res);
        else if ('$form' in req.query)
            return this.getForm(req, res);
            
        const definitions = {uuid: 'uuid', username: 'string'};
        const assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        let options = {
            limit: 10,
            offset: 0,
            view: true,
            where: {},
            loc: req.loc,
            includeUser: true,
            includeRoles: true,
            includeRolesId: assignableRolesId,
        };

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        options.where ??= {};
        options.where.siteId = req.site.id;

        if (options.where.uuid) {
            options.where.userUuid = options.where.uuid;
            delete options.where.uuid;
        }

        const result = await memberService.getListAndCount(options);
        result.rows.map(row => {
            if (row.Roles?.length) {
                if (row.Roles.every(role => role.isEnabled)) // all are true
                    row.isEnabled = true;
                else if (row.Roles.every(role => role.isEnabled === false)) // all are folse
                    row.isEnabled = false;
            }
        });

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('member.create')) actions.push('create');
        if (req.permissions.includes('member.edit')) {
            actions.push({
                name: 'setPassword',
                actionData: {param: {uuid: 'User.uuid'}},
            });
            actions.push({
                name: 'edit',
                actionData: {param: {uuid: 'User.uuid'}},
            });
            actions.push({
                name: 'enableDisable',
                actionData: {bodyParam: {uuid: 'User.uuid'}},
            });
        }
        if (req.permissions.includes('member.delete'))
            actions.push({
                name: 'delete',
                actionData: {bodyParam: {uuid: 'User.uuid'}},
            });
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('member', 'Members'),
            load: {
                service: 'user',
                method: 'get',
                queryParam: 'companyUuid',
            },
            actions: actions,
            columns: [
                {
                    name: 'User.displayName',
                    type: 'text',
                    label: await loc._c('member', 'Display name'),
                },
                {
                    name: 'User.username',
                    type: 'text',
                    label: await loc._c('member', 'Username'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._c('member', 'Member'),
            action: 'member',
            fields: [
                {
                    name: 'User.displayName',
                    type: 'text',
                    label: await loc._c('member', 'Display name'),
                    placeholder: await loc._c('member', 'Type the display name here'),
                    autocomplete: 'off',
                },
                {
                    name: 'User.username',
                    type: 'text',
                    label: await loc._c('member', 'Username'),
                    placeholder: await loc._c('member', 'Username'),
                    autocomplete: 'off',
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._c('member', 'Enabled'),
                    placeholder: await loc._c('member', 'Enabled'),
                    value: true,
                },
                {
                    name: 'Roles',
                    type: 'select',
                    multiple: true,
                    big: true,
                    label: await loc._c('member', 'Roles'),
                    loadOptionsFrom: {
                        service: 'member-role',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                },
                {
                    name: 'User.password',
                    type: 'password',
                    label: await loc._c('member', 'Password'),
                    placeholder: await loc._c('member', 'Type here the new password for member'),
                    autocomplete: 'off',
                    include: {
                        create: true,
                        defaultValue: false,
                    },
                },
            ],
        });
    }

    static async getRoles(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {
            view: true,
            limit: 100,
            offset: 0,
            attributes: ['uuid', 'name', 'title', 'description', 'isTranslatable'],
            isEnabled: true,
            raw: true,
        };

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);

        if (!req.roles.includes('admin'))
            options.where = {...options?.where, id: await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles)};

        const roleService = conf.global.services.Role.singleton();
        const result = await roleService.getListAndCount(options);
        
        const loc = req.loc;
        result.rows = await Promise.all(result.rows.map(async row => {
            if (row.isTranslatable)
                row.title = await loc._(row.title);

            delete row.isTranslatable;

            return row;
        }));

        res.status(200).send(result);
    }
    
    static async post(req, res) {
        const loc = req.loc;
        checkParameter(req?.body?.User, {username: loc._cf('member', 'Username'), displayName: loc._cf('member', 'Display name')});

        const data = {
            ...req.body,
            siteId: req.site.id,
            rolesUuid: await checkParameterUuidList(req.body.Roles, loc._cf('member', 'Roles')),
        };
        if (!req.roles.includes('admin'))
            data.assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        await memberService.create(data, {loc});

        res.status(204).send();
    }

    static async delete(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        const userId = await this.getUserIdFromUuid(req, uuid);

        const deleteWhere = {
            siteId: req.site.id,
            userId,
        };

        if (!req.roles.includes('admin'))
            deleteWhere.roleId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
            
        const rowsDeleted = await memberService.deleteFor(deleteWhere);
        if (!rowsDeleted)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    static async enablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        const userId = await this.getUserIdFromUuid(req, uuid);

        const rowsUpdated = await memberService.enableForSiteIdAndUserId(req.site.id, userId);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    static async disablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        const userId = await this.getUserIdFromUuid(req, uuid);

        const rowsUpdated = await memberService.disableForSiteIdAndUserId(req.site.id, userId);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    static async patch(req, res) {
        const loc = req.loc;
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        const userId = await this.getUserIdFromUuid(req, uuid);
        const siteId = req.site.id;

        const data = {
            ...req.body,
            siteId,
            userId,
            rolesUuid: await checkParameterUuidList(req.body.Roles, loc._cf('member', 'Roles')),
        };
        const options = {};
        if (!req.roles.includes('admin'))
            options.assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
        
        const rowsUpdated = await memberService.updateFor(data, {userId, siteId}, options);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    static async checkChangePasswordPermission(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        const userId = await this.getUserIdFromUuid(req, uuid);

        let sites = await siteService.getForUserId(userId);
        sites = sites.filter(site => site.name !== 'system');
        if (sites.length !== 1)
            throw new _HttpError(req.loc._cf('member', 'You cannot change the member password because the member has another accesses. Please contact the asministrator.', 403));

        const site = sites[0].toJSON();
        if (sites[0].id !== req.site.id)
            throw new _HttpError(req.loc._cf('member', 'You cannot change the member password because the member the user belongs to another site. Please contact the asministrator.', 403));

        const user = (await userService.getForId(userId)).toJSON();

        const rolesId = await roleService.getAllIdsForUsernameAndSiteName(user.username, site.name);
        const assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        for (const roleId of rolesId) {
            if (!assignableRolesId.includes(roleId)) {
                res.status(403).send(req.loc._cf('member', 'You cannot change the member password because the member has another accesses. Please contact the asministrator.'));
                return false;
            }
        }

        return {user};
    }

    static async getSetPassword(req, res) {
        if ('$form' in req.query)
            return this.getSetPasswordForm(req, res);

        const {user} = await this.checkChangePasswordPermission(req, res);
        
        res.status(200).send({rows:[{displayName: user.displayName}]});
    }

    static async getSetPasswordForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._c('member', 'Set member\'s password'),
            action: 'member-set-password',
            method: 'POST',
            fields: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._c('member', 'Member'),
                    autocomplete: 'off',
                    disabled: true,
                },
                {
                    name: 'password',
                    type: 'password',
                    label: await loc._c('member', 'Password'),
                    placeholder: await loc._c('member', 'Type here the new password for member'),
                    autocomplete: 'off',
                },
            ],
        });
    }
    
    static async postSetPassword(req, res) {
        const loc = req.loc;
        checkParameter(req?.body, {password: loc._cf('member', 'password')});
        const data = req.body;

        checkParameterNotNullOrEmpty(data.password, loc._cf('member', 'password'));
        
        const {user} = await this.checkChangePasswordPermission(req, res);

        const identity = await identityService.getLocalForUserId(user.id);
        if (!identity)
            throw new _HttpError(loc._cf('member', 'Error to get local identity'), 404);

        const result = await identityService.updateForId({password: data.password}, identity.id);
        if (result)
            return res.status(204).send();

        throw new _HttpError(loc._cf('member', 'Error to change the password'), 500);
    }
}