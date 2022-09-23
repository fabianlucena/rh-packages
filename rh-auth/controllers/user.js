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
userPost(req, res) {
    return UserService
        .create (req.body)
        .then(userList => res.status(204).send())
        .catch(httpUtil.errorHandler(req, res))
},

/**
 * @swagger
 * /api/user:
 *  get:
 *      tags:
 *          - User
 *      summary: Get user or a user list
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
userGet(req, res) {
    const definitions = {uuid: 'uuid', username: 'string'},
        options = {view: true, limit: 10, offset: 0};

    httpUtil.getOptionsFromParamsAndOData(req?.query, definitions, options)
        .then(options => UserService.getList(options))
        .then(rows => res.status(200).send(rows))
        .catch(httpUtil.errorHandler(req, res));
},

/**
 * @swagger
 * /api/user:
 *  delete:
 *      tags:
 *          - User
 *      summary: Delete an user
 *      description: Delete a user from its UUID
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
userDelete(req, res) {
    ru.checkParameterUUID(req?.query, 'uuid')
        .then(uuid => UserService.delete(uuid))
        .then(() => res.sendStatus(204))
        .catch(httpUtil.errorHandler(req, res));
},
};