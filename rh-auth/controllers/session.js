import {SessionService, SessionClosedError, NoSessionForAuthTokenError} from '../services/session.js';
import {getOptionsFromParamsAndOData, deleteHandler} from 'http-util';
import {getErrorMessage, checkParameter, checkParameterUuid, defaultLoc} from 'rf-util';

function hidePrivateData(data) {
    if (typeof data !== 'object') {
        return data;
    }

    const result = {};

    for (const k in data) {
        if (/password/.test(k)) {
            result[k] = '****';
        } else {
            result[k] = hidePrivateData(data[k]);
        }
    }

    return result;
}

export class SessionController {
    static configureMiddleware() {
        return async (req, res, next) => {
            let logLine = `${req.method} ${req.path}`;
            const logOptions = {};
            if (Object.keys(req.query).length) {
                logOptions.query = hidePrivateData(req.query);
            }

            if (Object.keys(req.body).length) {
                logOptions.body = hidePrivateData(req.body);
            }

            const authorization = req.header('Authorization');
            if (!authorization || authorization.length < 8 || !authorization.startsWith('Bearer ')) {
                req.log?.info(logLine, logOptions);
                next();
                return;
            }

            req.authToken = authorization.substring(7);
            if (!req.authToken) {
                req.log?.info(logLine, logOptions);
                next();
                return;
            }

            const loc = req.loc ?? defaultLoc;
            SessionService.singleton().getJSONForAuthTokenCached(req.authToken)
                .then(session => {
                    req.session = session;
                    req.user = req.session.User;
                    req.log?.info(logLine, {...logOptions, session: session.id, username: session.User.username});
                    next();
                })
                .catch(async err => {
                    let result;
                    if (err instanceof SessionClosedError) {
                        result = {message: await loc._c('session', 'HTTP error 401 unauthorized, session is closed.')};
                    } else if (err instanceof NoSessionForAuthTokenError) {
                        result = {message: await loc._c('session', 'HTTP error 401 unauthorized, authorization token error.')};
                    } else {
                        let msg;
                        if (err instanceof Error) {
                            msg = await getErrorMessage(err, loc);
                        } else {
                            msg = err;
                        }

                        if (msg) {
                            result = {message: await loc._c('session', 'HTTP error 401 unauthorized: %s', msg)};
                        } else {
                            result = {message: await loc._c('session', 'HTTP error 401 unauthorized')};
                        }
                    }

                    result.error ??= 'Unauthorized';
                    result.title ??= await loc._c('Unauthorized');
                    result.clearBearerAuthorization = true;
                    result.redirectTo = '#login';

                    req.log.error(logLine, {...logOptions, error: err, result});
                    res.status(401).send(result);
                });
        };
    }

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
    static async get(req, res) {
        if ('$grid' in req.query) {
            return SessionController.getGrid(req, res);
        } else if ('$form' in req.query) {
            return SessionController.getForm(req, res);
        }
            
        const definitions = {uuid: 'uuid', open: 'date', close: 'date', authToken: 'string', index: 'int'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        try {
            await req.checkPermission('session.get');
        } catch(_) {
            options.where = {...options?.where, id: req.session.id};
        }

        const loc = req.loc ?? defaultLoc;
        const strftime = loc.strftime ?? ((f, v) => v);
        const data = await SessionService.singleton().getListAndCount(options);
        data.rows = await Promise.all(data.rows.map(async row => {
            if (row.toJSON) {
                row = row.toJSON();
            }
                
            row.open = await strftime('%x %X', row.open);
            if (row.close) {
                row.close = await strftime('%x %X', row.close);
            }

            return row;
        }));

        res.status(200).send(data);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('session.delete')) actions.push('delete');

        actions.push('search', 'paginate');
        
        const loc = req.loc ?? defaultLoc;

        res.status(200).send({
            title: await loc._c('session', 'Sessions'),
            load: {
                service: 'session',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'open',
                    type: 'text',
                    label: await loc._c('session', 'Open'),
                },
                {
                    name: 'close',
                    type: 'text',
                    label: await loc._c('session', 'Close'),
                },
            ]
        });
    }

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
    static async delete(req, res) {
        const loc = req.loc ?? defaultLoc;
        const uuid = checkParameterUuid(req?.query?.uuid, loc._cf('session', 'UUID'));
        const rowCount = await SessionService.singleton().deleteForUuid(uuid);
        await deleteHandler(req, res, rowCount);
    }
}