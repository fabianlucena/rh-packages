import {LoginService} from '../services/login.js';
import {conf} from '../conf.js';
import {_HttpError} from 'http-util';
import {checkParameter} from 'rf-util';

export class LoginController {
    /**
     * @swagger
     * definitions:
     *  Identity:
     *      properties:
     *          userId:
     *              type: string
     *          typeId:
     *              type: integer
     *          data:
     *              type: JSON
     *  Login:
     *      type: object
     *      properties:
     *          username:
     *              type: string
     *              required: true
     *              example: admin
     *          password:
     *              type: string
     *              format: password
     *              required: true
     *              example: 1234
     *          deviceId:
     *              type: string
     *              example: null
     *          sessionIndex:
     *              type: string
     *              example: null
     *  Auth:
     *      properties:
     *          index:
     *              type: string
     *              example: null
     *          authToken:
     *              type: string
     *              example: adfa9d8fa0s9d8f7a09d8f7a0d7f0a9sf7a...
     *  Error:
     *      properties:
     *          error:
     *              type: string
     *              example: Example error
     */
    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('login', 'Login'),
            action: 'login',
            method: 'post',
            onSuccess: {
                setBearerAuthorizationFromResponseProperty: 'authToken',
                reloadMenu: true,
            },
            includeSessionIndexInBody: true,
            skipConfirmation: true,
            fields: [
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._c('login', 'Username'),
                    placeholder: await loc._c('login', 'Type the username here'),
                },
                {
                    name: 'password',
                    type: 'password',
                    label: await loc._c('login', 'Password'),
                    placeholder: await loc._c('login', 'Type the password here'),
                }
            ]
        });
    }

    /** 
     * @swagger
     * /api/login:
     *  post:
     *      tags:
     *          - Authorization
     *      summary: Login
     *      description: Get credential for use the system
     *      produces:
     *          -  application/json
     *      consumes:
     *          -  application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Login'
     *      responses:
     *          '201':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Auth'
     *          '400':
     *              description: Missing parameters
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Invalid login, failed login, or other error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async post(req, res) {
        const loc = req.loc;
        if (req?.body?.autoLoginToken) {
            checkParameter(req?.body, 'autoLoginToken', 'deviceToken');
        } else {
            checkParameter(req?.body, {username: loc._cf('login', 'Username'), password: loc._cf('login', 'Password')});
        }

        try {
            const loginService = LoginService.singleton();
            let session;
            if (req.body.autoLoginToken) {
                session = await loginService.forAutoLoginTokenAndSessionIndex(req.body.autoLoginToken, req.body.deviceToken, req.body?.sessionIndex ?? req.body.index, req.loc);
                req.log?.info('Auto logged by autoLoginToken.', {autoLoginToken: req.body.autoLoginToken, session});
            } else {
                session = await loginService.forUsernamePasswordDeviceTokenAndSessionIndex(req.body.username, req.body.password, req.body.deviceToken, req.body.sessionIndex ?? req.body.index, req.loc);
                req.log?.info(`User ${req.body.username} successfully logged with username and password.`, {session});
            }

            const now = new Date();
            const expires30  = new Date();
            const expires365 = new Date();
            expires30. setDate(now.getDate() + 30);
            expires365.setDate(now.getDate() + 365);
            
            let result = {
                index: session.index,
                authToken: session.authToken,
                setCookies: {
                    deviceToken: {
                        value: session.deviceToken,
                        expires: expires365.toISOString(),
                        path: '/',
                        sameSite: 'strict',
                    },
                    autoLoginToken: {
                        value: session.autoLoginToken,
                        expires: expires30.toISOString(),
                        sameSite: 'strict',
                    },
                },
            };

            await conf.global.eventBus?.$emit(
                'login',
                result,
                {
                    sessionId: session.id,
                    oldSessionId: session.oldSessionId,
                    autoLogin: !!req.body.autoLoginToken
                }
            );

            req.session = session;
            res.header('Authorization', 'Bearer ' + session.authToken);
            res.cookie('deviceToken',  session.deviceToken,  {expire: expires365, path: '/'});
            res.cookie('autoLoginToken', session.autoLoginToken, {expire: expires30});
            res.status(201).send(result);
        } catch (error) {
            if (req.body.autoLoginToken) {
                req.log?.info(`Error trying logged by autoLoginToken: ${error}.`, {autoLoginToken: req.body.autoLoginToken, error});
            } else {
                req.log?.info(`Error in login: ${error}.`, {username: req.body.username, error});
            }

            throw new _HttpError(req.loc._cf('login', 'Invalid login'), 403);
        }
    }
}
