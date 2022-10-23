const UserService = require('../services/user');
const httpUtil = require('http-util');
const ru = require('rofa-util');

module.exports = {

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
    async userPost(req, res) {
        ru.checkParameter(req?.body, 'username', 'displayName');
        await UserService.create(req.body);
        res.status(204).send();
    },

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
    async userGet(req, res) {
        const definitions = {uuid: 'uuid', username: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await httpUtil.getOptionsFromParamsAndODataAsync(ru.merge(req.query, req.params), definitions, options);
        const rows = await UserService.getList(options);
        res.status(200).send(rows);
    },

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
    async userDelete(req, res) {
        const uuid = await ru.checkParameterUUID(ru.merge(req.query, req.params), 'uuid');
        const rowsDeleted = await UserService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new httpUtil._HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    },

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
    async userEnable(req, res) {
        const uuid = await ru.checkParameterUUID(ru.merge(req.query, req.params), 'uuid');
        const rowsDeleted = await UserService.enableForUuid(uuid);
        if (!rowsDeleted)
            throw new httpUtil._HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    },

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
    async userDisable(req, res) {
        const uuid = await ru.checkParameterUUID(ru.merge(req.query, req.params), 'uuid');
        const rowsDeleted = await UserService.disableForUuid(uuid);
        if (!rowsDeleted)
            throw new httpUtil._HttpError('User with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    },
};