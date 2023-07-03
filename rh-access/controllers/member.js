'use strict';

import {MemberService} from '../services/member.js';
import {AssignableRolePerRoleService} from '../services/assignable_role_per_role.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid, checkParameterUuidList} from 'rf-util';

const memberService = MemberService.singleton();
const assignableRolePerRoleService = AssignableRolePerRoleService.singleton();

export class MemberController {
    static async checkUuid(req, uuid) {
        const member = await memberService.getForUuid(uuid, {where: {siteId: req.site.id}, skipNoRowsError: true});
        if (!member)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 404, uuid);

        return true;
    }

    static async get(req, res) {
        if ('$grid' in req.query)
            return this.getGrid(req, res);
        else if ('$form' in req.query)
            return this.getForm(req, res);
            
        const definitions = {uuid: 'uuid', name: 'string'};
        const assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        let options = {
            limit: 10,
            offset: 0,
            view: true,
            where: {},
            loc: req.loc,
            includeRoles: true,
            includeRolesId: assignableRolesId,
        };

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        options.where ??= {};
        options.where.siteId = req.site.id;

        const result = await memberService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('member.create')) actions.push('create');
        if (req.permissions.includes('member.edit'))   actions.push('enableDisable','edit');
        if (req.permissions.includes('member.delete')) actions.push('delete');
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
                    name: 'displayName',
                    type: 'text',
                    label: await loc._c('member', 'Display name'),
                },
                {
                    name: 'username',
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
                    name: 'displayName',
                    type: 'text',
                    label: await loc._c('member', 'Display name'),
                    placeholder: await loc._c('member', 'Type the display name here'),
                    autocomplete: 'off',
                },
                {
                    name: 'username',
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
                    name: 'password',
                    type: 'password',
                    label: await loc._c('member', 'Password'),
                    placeholder: await loc._c('member', 'Type here the new password for user'),
                    autocomplete: 'off',
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
        checkParameter(req?.body, {username: loc._cf('member', 'Username'), displayName: loc._cf('member', 'Display name')});

        const data = {
            ...req.body,
            siteId: req.site.id,
            rolesUuid: await checkParameterUuidList(req.body.Roles, loc._cf('member', 'Roles')),
        };
        if (!req.roles.includes('admin'))
            data.assignableRolesId = await assignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        await memberService.create(data);

        res.status(204).send();
    }

    /*static async delete(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsDeleted = await memberService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }*/

    static async enablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await memberService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    static async disablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('member', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await memberService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    /*static async patch(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('scenario', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await memberService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('member', 'The member with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }*/
}