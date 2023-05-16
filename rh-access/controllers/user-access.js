import {UserRoleSiteService} from '../services/user_role_site.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndODataAsync} from 'http-util';
import {checkParameter} from 'rf-util';

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
     *          -  name: body
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
    /*static async post(req, res) {
        checkParameter(req?.body, 'username', 'displayName');
        const UserService = conf.global.services.User;

        if (await UserService.getForUsername(req.body.username, {skipNoRowsError: true}))
            throw new ConflictError();

        await UserService.create(req.body);

        res.status(204).send();
    }*/

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
           
        const sequelize = conf.global.sequelize;
        const definitions = {uuid: 'string', username: 'string'};
        let options = {
            view: true,
            limit: 10,
            offset: 0,
            includeUser: true,
            includeSite: true,
            raw: true,
            nest: true,
            attributes: [
                [sequelize.fn('concat', sequelize.col('User.uuid'), ',', sequelize.col('Site.uuid')), 'uuid'],
            ],
            group: [
                'UserRoleSite.userId',
                'User.uuid',
                'User.username',
                'User.displayName',
                'User.isTranslatable',
                'Site.uuid',
                'Site.name',
                'Site.title',
                'Site.isTranslatable',
            ],
            order: [[sequelize.col('User.username'), 'ASC']],
        };

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        if (options.where?.uuid)
            options.where.uuid = sequelize.where(sequelize.fn('concat', sequelize.col('User.uuid'), ',', sequelize.col('Site.uuid')), options.where.uuid);

        const result = await UserRoleSiteService.getListAndCount(options);
        const loc = req.loc;

        result.rows = await Promise.all(result.rows.map(async row => {
            if (row.User.isTranslatable)
                row.User.displayName = await loc._(row.User.displayName);
            delete row.User.isTranslatable;

            if (row.Site?.isTranslatable)
                row.Site.title = await loc._(row.Site.title);
            delete row.Site.isTranslatable;

            row.Roles = await Promise.all(
                (await UserRoleSiteService.getList({
                    includeRole: true,
                    view: true,
                    attributes: [],
                    raw: true,
                    nest: true,
                })).map(async role => {
                    role = role.Role;
                    if (role?.isTranslatable)
                        role.title = await loc._(role.title);
                    delete role.isTranslatable;

                    return role;
                })
            );

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
                    type: 'objectList',
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
            fields: [
                {
                    name: 'User',
                    type: 'select',
                    label: await loc._('User'),
                    loadOptionsFrom: {
                        service: 'user-access-user',
                        valueProperty: 'uuid',
                        value: 'uuid',
                        text: 'displayName',
                        title: 'username',
                    },
                },
                {
                    name: 'Site',
                    type: 'select',
                    label: await loc._('Sites'),
                    loadOptionsFrom: {
                        service: 'user-access-site',
                        valueProperty: 'uuid',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                },
                {
                    name: 'Roles',
                    type: 'selectFromList',
                    label: await loc._('Roles'),
                    loadOptionsFrom: {
                        service: 'user-access-role',
                        valueProperty: 'uuid',
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

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const UserService = conf.global.services.User;
        const result = await UserService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getSites(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'name', 'title', 'description'], isEnabled: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const SiteService = conf.global.services.Site;
        const result = await SiteService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getRoles(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'name', 'title', 'description'], isEnabled: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const RoleService = conf.global.services.Role;
        const result = await RoleService.getListAndCount(options);

        res.status(200).send(result);
    }
}