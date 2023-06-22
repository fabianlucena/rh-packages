import {RoleService} from '../services/role.js';
import {UserSiteRoleService} from '../services/user_site_role.js';
import {AssignableRolePerRoleService} from '../services/assignable_role_per_role.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid, checkParameterUuidList, checkNotNullOrEmpty} from 'rf-util';

/**
 * @swagger
 * definitions:
 *  QAAIT User:
 *      type: object
 *      properties:
 *          username:
 *              type: string
 *              required: true
 *              example: admin
 *          displayName:
 *              type: string
 *              required: true
 *              example: Admin
 *          typeId:
 *              type: integer
 *          isEnabled:
 *              type: boolean
 */
    
export class UserAccessController {
    /**
     * @swagger
     * /api/user-access:
     *  post:
     *      tags:
     *          - User
     *      summary: Create a QAAIT user
     *      description: Add a new QAAIT user to the database
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          - application/json
     *      parameters:
     *          -  User: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/User'
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '400':
     *              description: Missing parameters
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async post(req, res) {
        const loc = req.loc;
        const userUuid = checkParameterUuid(req.body.User, loc._cf('userAccess', 'User'));
        const siteUuid = checkParameterUuid(req.body.Site, loc._cf('userAccess', 'Site'));
        const roleUuidList = checkParameterUuidList(req.body.Roles, loc._cf('userAccess', 'Roles'));

        const userId = await conf.global.services.User.singleton().getIdForUuid(userUuid);
        const siteId = await conf.global.services.Site.getIdForUuid(siteUuid);

        const options = {
            attributes: ['userId'],
            where: {
                userId,
                siteId,
            },
            raw: true,
            nest: true,
        };

        let assignableRolesId;
        if (!req.roles.includes('admin'))
            assignableRolesId = await AssignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        const roleIdList = [];
        await Promise.all(await roleUuidList.map(async roleUuid => {
            const roleId = await RoleService.getIdForUuid(roleUuid);
            roleIdList.push(roleId);

            options.where.roleId = roleId;
            const result = await UserSiteRoleService.getList(options);
            if (!result?.length && (!assignableRolesId || assignableRolesId.includes(roleId))) {
                await UserSiteRoleService.create({
                    userId,
                    siteId,
                    roleId,
                });
            }
        }));

        const deleteWhere = {userId, siteId, notRoleId: roleIdList};
        if (assignableRolesId)
            deleteWhere.roleId = assignableRolesId;

        await UserSiteRoleService.delete(deleteWhere);

        res.status(204).send();
    }

    /**
     * @swagger
     * /api/user-access:
     *  get:
     *      tags:
     *          - User
     *      summary: Get a QAAIT user or a QAAIT user list
     *      description: If the UUID or username params is provided this endpoint returns a single user otherwise returns a list of users
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
     *          -   name: username
     *              in: query
     *              type: string
     *              example: admin
     *          -   name: limit
     *              in: query
     *              type: int
     *          -   name: offset
     *              in: query
     *              type: int
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/User'
     *          '204':
     *              description: Success no user
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        if ('$grid' in req.query)
            return UserAccessController.getGrid(req, res);
        else if ('$form' in req.query)
            return UserAccessController.getForm(req, res);
           
        let options = {
            view: true,
            limit: 10,
            offset: 0,
            includeUser: {},
            includeSite: {},
            raw: true,
            nest: true,
            attributes: ['userId', 'siteId'],
            group: [
                'userId',
                'siteId',
                'UserSiteRole.userId',
                'User.uuid',
                'User.username',
                'User.displayName',
                'User.isTranslatable',
                'Site.uuid',
                'Site.name',
                'Site.title',
                'Site.isTranslatable',
            ],
            order: [['User.username', 'ASC']],
        };

        const definitions = {uuid: 'string', username: 'string'};
        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);

        let assignableRolesId;
        if (!req.roles.includes('admin')) {
            assignableRolesId = await AssignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);
            options.where ??= {};
            options.where.roleId = assignableRolesId;
        }

        if (options.where?.uuid) {
            const uuid = options.where.uuid.split(',');
            delete options.where.uuid;

            options.includeUser = {...options.includeUser, where: {...options.includeUser.where, uuid: uuid[0]}};
            options.includeSite = {...options.includeSite, where: {...options.includeSite.where, uuid: uuid[1]}};
        }

        const roleQueryOptions = {
            view: true,
            includeUser: {attributes: []},
            includeSite: {attributes: []},
            includeRole: {},
            attributes: [],
            where: {},
            raw: true,
            nest: true,
        };
        
        if (assignableRolesId)
            roleQueryOptions.where = {roleId: assignableRolesId};

        const result = await UserSiteRoleService.getListAndCount(options);
        const loc = req.loc;

        result.rows = await Promise.all(result.rows.map(async row => {
            row.uuid = row.User.uuid + ',' + row.Site.uuid;

            if (row.User.isTranslatable)
                row.User.displayName = await loc._(row.User.displayName);
            delete row.User.isTranslatable;

            if (row.Site?.isTranslatable)
                row.Site.title = await loc._(row.Site.title);
            delete row.Site.isTranslatable;

            roleQueryOptions.where.userId = row.userId;
            roleQueryOptions.where.siteId = row.siteId;

            row.Roles = await Promise.all(
                (await UserSiteRoleService.getList(roleQueryOptions))
                    .map(async role => {
                        role = role.Role;
                        if (role?.isTranslatable)
                            role.title = await loc._(role.title);
                        delete role.isTranslatable;

                        return role;
                    })
            );

            delete row.userId;
            delete row.siteId;

            return row;
        }));

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('user-access.create')) actions.push('create');
        if (req.permissions.includes('user-access.edit'))   actions.push('edit');
        if (req.permissions.includes('user-access.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('Users accesses'),
            load: {
                service: 'user-access',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'User.displayName',
                    type: 'text',
                    label: await loc._('User'),
                },
                {
                    name: 'Site.title',
                    type: 'text',
                    label: await loc._('Site'),
                },
                {
                    name: 'Roles',
                    type: 'list',
                    label: await loc._('Roles'),
                    properties: ['title'],
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._('User access'),
            action: 'user-access',
            method: 'POST',
            fields: [
                {
                    name: 'User',
                    type: 'select',
                    label: await loc._('User'),
                    loadOptionsFrom: {
                        service: 'user-access-user',
                        value: 'uuid',
                        text: 'displayName',
                        title: 'username',
                    },
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'Site',
                    type: 'select',
                    label: await loc._('Sites'),
                    loadOptionsFrom: {
                        service: 'user-access-site',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'Roles',
                    type: 'select',
                    multiple: true,
                    big: true,
                    label: await loc._('Roles'),
                    loadOptionsFrom: {
                        service: 'user-access-role',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                },
            ],
        });
    }

    static async getUsers(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'username', 'displayName'], isEnabled: true};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);

        const userService = conf.global.services.User;
        const result = await userService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getSites(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'name', 'title', 'description'], isEnabled: true};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);

        const SiteService = conf.global.services.Site;
        const result = await SiteService.getListAndCount(options);

        res.status(200).send(result);
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
            options.where = {...options?.where, id: await AssignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles)};

        const RoleService = conf.global.services.Role;
        const result = await RoleService.getListAndCount(options);
        
        const loc = req.loc;
        result.rows = await Promise.all(result.rows.map(async row => {
            if (row.isTranslatable)
                row.title = await loc._(row.title);

            delete row.isTranslatable;

            return row;
        }));

        res.status(200).send(result);
    }

    /**
     * @swagger
     * /api/user-access:
     *  delete:
     *      tags:
     *          - User Access
     *      summary: Delete an user access
     *      description: Delete a user access from the user UUID and site UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID,UUID
     *              required: true
     *              example: 0F7B8F7F-D792-405B-8DE0-2E9E04BAC3A4,D781CFDF-CB71-4428-8F49-614387500813
     *      responses:
     *          '204':
     *              description: Success
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async delete(req, res) {
        const loc = req.loc;

        let userUuid = checkParameterUuid(req.body.User, {paramTitle: loc._cf('userAccess', 'User'), allowNull: true, allowUndefined: true});
        let siteUuid = checkParameterUuid(req.body.Site, {paramTitle: loc._cf('userAccess', 'Site'), allowNull: true, allowUndefined: true});
        if (userUuid) {
            if (!siteUuid)
                throw new _HttpError(req.loc._cf('userAccess', 'Site UUID param is missing.'), 403);
        } else if (siteUuid)
            throw new _HttpError(req.loc._cf('userAccess', 'User UUID param is missing.'), 403);
        else {
            const uuid = await checkNotNullOrEmpty(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('userAccess', 'UUID'));
            const uuidParts = uuid.split(',');
            if (uuidParts.length !== 2)
                throw new _HttpError(req.loc._cf('userAccess', 'Wrong UUID format.'), 403);

            userUuid = checkParameterUuid(uuidParts[0], loc._cf('userAccess', 'User'));
            siteUuid = checkParameterUuid(uuidParts[1], loc._cf('userAccess', 'Site'));
        }

        let rowsDeleted;
        const deleteWhere = {userUuid, siteUuid};
        if (!req.roles.includes('admin'))
            deleteWhere.notRoleName = await AssignableRolePerRoleService.getAssignableRolesIdForRoleName(req.roles);

        rowsDeleted = await UserSiteRoleService.delete(deleteWhere);

        if (!rowsDeleted)
            throw new _HttpError(req.loc._cf('userAccess', 'User with UUID %s has not access to the site with UUID %s.'), 403, userUuid, siteUuid);

        res.sendStatus(204);
    }
}