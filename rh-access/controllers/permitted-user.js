import {conf} from '../conf.js';
import {getOptionsFromParamsAndODataAsync, ConflictError} from 'http-util';
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
    
export class PermittedUserController {
    /**
     * @swagger
     * /api/permitted-user:
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
    static async post(req, res) {
        checkParameter(req?.body, 'username', 'displayName');
        const UserService = conf.global.services.User;

        if (await UserService.getForUsername(req.body.username, {skipNoRowsError: true}))
            throw new ConflictError();

        await UserService.create(req.body);

        res.status(204).send();
    }

    /**
     * @swagger
     * /api/permitteduser:
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
            return PermittedUserController.getGrid(req, res);
        else if ('$form' in req.query)
            return PermittedUserController.getForm(req, res);
            
        const definitions = {uuid: 'uuid', username: 'string'};
        let options = {
            view: true,
            limit: 10,
            offset: 0,
            include: [
                { 
                    model: conf.global.models.Role,
                    attributes: ['uuid', 'name', 'title']
                },
                { 
                    model: conf.global.models.UserGroup,
                    attributes: ['uuid', 'name', 'title']
                }
            ],
            raw: true,
            nest: true
        };

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const UserService = conf.global.services.User;
        const result = await UserService.getListAndCount(options);

        result.rows = await Promise.all(result.rows.map(async row => {
            let roles = row.Roles;
            delete row.Roles;

            if (!(roles instanceof Array))
                roles = [roles];
            
            row.roles = roles;

            return row;
        }));

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('permitted-user.create')) actions.push('create');
        if (req.permissions.includes('permitted-user.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('permitted-user.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('Permitted users'),
            load: {
                service: 'permitted-user',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._('Display name'),
                },
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._('Username'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._('Permitted user'),
            action: 'permitted-user',
            fields: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._('Display name'),
                    placeholder: await loc._('Display name'),
                    required: true,
                },
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._('Username'),
                    placeholder: await loc._('Username'),
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                    required: true,
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._('Enabled'),
                    placeholder: await loc._('Enabled'),
                    value: true,
                },
                {
                    name: 'sites',
                    type: 'selectFromList',
                    label: await loc._('Sites'),
                    loadOptionsFrom: {
                        service: 'permitted-user-site',
                        valueProperty: 'uuid',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                },
                /*{
                    name: 'roles',
                    type: 'selectFromList',
                    label: await loc._('Roles'),
                    loadOptionsFrom: {
                        service: 'permitted-user-role',
                        valueProperty: 'uuid',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
                    },
                },*/
                {
                    name: 'groups',
                    type: 'selectFromList',
                    label: await loc._('Groups'),
                    loadOptionsFrom: {
                        service: 'permitted-user-group',
                        valueProperty: 'uuid',
                        value: 'uuid',
                        text: 'displayName',
                    },                    
                },
            ],
        });
    }

    static async getRoles(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'name', 'title', 'description'], isEnabled: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const RoleService = conf.global.services.Role;
        const result = await RoleService.getListAndCount(options);

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

    static async getGroups(req, res) {
        const definitions = {uuid: 'uuid', title: 'string'};
        let options = {view: true, limit: 100, offset: 0, attributes: ['uuid', 'username', 'displayName'], isEnabled: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);

        const UserService = conf.global.services.User;
        const result = await UserService.getListAndCount(options);

        res.status(200).send(result);
    }
}