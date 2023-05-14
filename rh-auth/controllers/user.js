import {UserService} from '../services/user.js';
import {getOptionsFromParamsAndODataAsync, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUUID} from 'rf-util';

/**
 * @swagger
 * definitions:
 *  User:
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
    
export class UserController {
    /**
     * @swagger
     * /api/user:
     *  post:
     *      tags:
     *          - User
     *      summary: Create an user
     *      description: Add a new user to the database
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
        if (await UserService.getForUsername(req.body.username, {skipNoRowsError: true}))
            throw new ConflictError();

        await UserService.create(req.body);
        res.status(204).send();
    }

    /**
     * @swagger
     * /api/user:
     *  get:
     *      tags:
     *          - User
     *      summary: Get user or an user list
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
            return UserController.getGrid(req, res);
        else if ('$form' in req.query)
            return UserController.getForm(req, res);
            
        const definitions = {uuid: 'uuid', username: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);
        const result = await UserService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('user.create')) actions.push('create');
        if (req.permissions.includes('user.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('user.delete')) actions.push('delete');
        actions.push('search', 'paginate');
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('User'),
            load: {
                service: 'user',
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
                {
                    name: 'isEnabled',
                    type: 'bool',
                    label: await loc._('Enabled'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._('Users'),
            action: 'user',
            fields: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._('Display name'),
                    placeholder: await loc._('Display name'),
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
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._('Enabled'),
                    placeholder: await loc._('Enabled'),
                    value: true,
                },
            ],
        });
    }

    /**
     * @swagger
     * /api/user:
     *  delete:
     *      tags:
     *          - User
     *      summary: Delete an user
     *      description: Delete an user from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
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
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsDeleted = await UserService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/user/enable:
     *  post:
     *      tags:
     *          - User
     *      summary: Enable an user
     *      description: Enable an user from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
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
    static async enablePost(req, res) {
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await UserService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/user/disable:
     *  post:
     *      tags:
     *          - User
     *      summary: Disable an user
     *      description: Disable an user from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
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
    static async disablePost(req, res) {
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await UserService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/user:
     *  patch:
     *      tags:
     *          - User
     *      summary: Update an user
     *      description: Update an user from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/User'
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
    static async patch(req, res) {
        const uuid = await checkParameterUUID({...req.body, ...req.params}, 'uuid');
        const rowsUpdated = await UserService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }
}