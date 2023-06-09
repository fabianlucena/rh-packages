'use strict';

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
            title: await loc._('Login'),
            action: 'login',
            method: 'post',
            onSuccess: 'setBearerAuthorizationFromResponseProperty("authToken"); reloadMenu();',
            includeSessionIndexInBody: true,
            fields: [
                {
                    name: 'username',
                    type: 'text',
                    label: await loc._('Username'),
                    placeholder: await loc._('Username'),
                },
                {
                    name: 'password',
                    type: 'password',
                    label: await loc._('Password'),
                    placeholder: await loc._('Password'),
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
        if (req?.body?.autoLoginToken)
            checkParameter(req?.body, 'autoLoginToken', 'deviceToken');
        else
            checkParameter(req?.body, {username: loc._f('Username'), password: loc._f('Password')});

        try {
            let session;
            if (req.body.autoLoginToken)
                session = await LoginService.forAutoLoginTokenAndSessionIndex(req.body.autoLoginToken, req.body.deviceToken, req.body?.sessionIndex ?? req.body.index, req.loc);
            else
                session = await LoginService.forUsernamePasswordDeviceTokenAndSessionIndex(req.body.username, req.body.password, req.body.deviceToken, req.body.sessionIndex ?? req.body.index, req.loc);

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

            await Promise.all(await conf.global.eventBus?.$emit(
                'login',
                result,
                {
                    sessionId: session.id,
                    oldSessionId: session.oldSessionId,
                    autoLogin: !!req.body.autoLoginToken
                }
            ));

            req.session = session;
            res.header('Authorization', 'Bearer ' + session.authToken);
            res.cookie('deviceToken',  session.deviceToken,  {expire: expires365, path: '/'});
            res.cookie('autoLoginToken', session.autoLoginToken, {expire: expires30});
            res.status(201).send(result);
        } catch (err) {
            throw new _HttpError(req.loc._f('Invalid login'), 403);
        }
    }
}
