import {UserService} from '../services/user.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid} from 'rf-util';

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
        await UserService.singleton().create(req.body);
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
        if ('$grid' in req.query) {
            return UserController.getGrid(req, res);
        } else if ('$form' in req.query) {
            return UserController.getForm(req, res);
        }
            
        const definitions = {uuid: 'uuid', username: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await UserService.singleton().getListAndCount(options);

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
            title: await loc._c('user', 'User'),
            load: {
                service: 'user',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._c('user', 'Display name'),
                },
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._c('user', 'Username'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._c('user', 'Users'),
            action: 'user',
            fields: [
                {
                    name: 'displayName',
                    type: 'text',
                    label: await loc._c('user', 'Display name'),
                    placeholder: await loc._c('user', 'Type the display name here'),
                    autocomplete: 'off',
                },
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._c('user', 'Username'),
                    placeholder: await loc._c('user', 'Username'),
                    autocomplete: 'off',
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._c('user', 'Enabled'),
                    placeholder: await loc._c('user', 'Enabled'),
                    value: true,
                },
                {
                    name: 'password',
                    type: 'password',
                    label: await loc._c('user', 'Password'),
                    placeholder: await loc._c('user', 'Type here the new password for user'),
                    autocomplete: 'off',
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('user', 'UUID'));
        const rowsDeleted = await UserService.singleton().deleteForUuid(uuid);
        if (!rowsDeleted) {
            throw new _HttpError(req.loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
        }

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('user', 'UUID'));
        const rowsUpdated = await UserService.singleton().enableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
        }

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('user', 'UUID'));
        const rowsUpdated = await UserService.singleton().disableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
        }

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('user', 'UUID'));
        const rowsUpdated = await UserService.singleton().updateForUuid(req.body, uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('user', 'User with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }
}