import {UserService} from '../services/user.js';
import {getOptionsFromParamsAndODataAsync, _HttpError} from 'http-util';
import {checkParameter, checkParameterUUID} from 'rofa-util';

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
        const definitions = {uuid: 'uuid', username: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);
        const rows = await UserService.getList(options);
        res.status(200).send(rows);
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
        const uuid = await checkParameterUUID({...req.query, ...req.params}, 'uuid');
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
        const uuid = await checkParameterUUID({...req.query, ...req.params}, 'uuid');
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
        const uuid = await checkParameterUUID({...req.query, ...req.params}, 'uuid');
        const rowsUpdated = await UserService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/user/disable:
     *  patch:
     *      tags:
     *          - User
     *      summary: Disable an user
     *      description: Disable an user from its UUID
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