const SessionService = require('../services/session');
const httpUtil = require('http-util');
const ru = require('rofa-util');
const l = ru.locale;

module.exports = {

middleware(options) {
    return async (req, res, next) => {
        const authorization = req.header('Authorization');
        if (!authorization)
            return res.status(401).send({error: await req.locale._('HTTP error 401 unauthorized, no authorization header.')});

        if (!authorization.startsWith('Bearer '))
            return res.status(401).send({error: await req.locale._('HTTP error 401 unauthorized, authorization schema is no Bearer.')});
        
        const authToken = authorization.substring(7);
        SessionService.getForAuthTokenCached(authToken)
            .then(session => ru.check(session?.deviceId == req?.device?.id && session, {_message: l._f('Invalid device'), statusCode: 400}))
            .then(session => {
                req.session = session.toJSON();
                req.user = req.session.User;
                next();
            })
            .catch(async err => {
                if (err instanceof SessionService.IsClosedError)
                    res.status(403).send({error: await req.locale._('HTTP error 403 forbiden, session is closed.')});
                else {
                    if (err instanceof Error)
                        msg = await ru.getErrorMessage(err);
                    else
                        msg = err;

                    console.error(msg);

                    if (msg)
                        res.status(401).send({error: await req.locale._('HTTP error 401 unauthorized: %s', msg)});
                    else
                        res.status(401).send({error: await req.locale._('HTTP error 401 unauthorized')});
                }
            });
    }
},

/**
 * @swagger
 * definitions:
 *  Session:
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
 * /api/session:
 *  get:
 *      tags:
 *          - Session
 *      summary: Get session or a session list
 *      description: If the UUID or authToken params is provided this endpoint returns a single session otherwise returns a session list
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
 *          -   name: authToken
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
 *                  $ref: '#/definitions/Session'
 *          '204':
 *              description: Success no session
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
sessionGet(req, res) {
    const definitions = {uuid: 'uuid', open: 'date', close: 'date', authToken: 'string', index: 'int'};

    httpUtil.getOptionsFromParamsAndOData(req?.query, definitions)
        .then(options => new Promise((resolve, reject) => req.checkPermission('session.get')
            .then(() => resolve(options))
            .catch(() => resolve(ru.deepMerge(options, {where: {id: req.session.id}}))))
        )
        .then(options => SessionService.getList(ru.replace(options, {view: true})))
        .then(rows => res.status(200).send(rows))
        .catch(httpUtil.errorHandler(req, res));
},

/**
 * @swagger
 * /api/session:
 *  delete:
 *      tags:
 *          - Session
 *      summary: Delete an session
 *      description: Delete a session from its UUID
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
sessionDelete(req, res) {
    ru.checkParameterUUID(req?.query, 'uuid')
        .then(uuid => SessionService.deleteForUuid(uuid))
        .then(httpUtil.deleteHandler(req, res))
        .catch(httpUtil.errorHandler(req, res));
},

};