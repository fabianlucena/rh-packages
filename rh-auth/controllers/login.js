import {LoginService} from '../services/login.js';
import {HttpError} from 'http-util';
import {checkParameter} from 'rofa-util';

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

        res.status(200).send({
            username: {
                type: 'text',
                label: await req.locale._('Username')
            },
            password: {
                type: 'password',
                label: await req.locale._('Password')
            }
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
        checkParameter(req?.body, 'username', 'password');
        
        try {
            const session = await LoginService.forUsernamePasswordAndDeviceId(req?.body?.username, req?.body?.password, req?.device?.id, req?.sessionIndex, req.locale);
            req.session = session;
            res.header('Authorization', 'Bearer ' + session.authToken);
            res.status(201).send({
                index: session.index,
                authToken: session.authToken,
            });
        } catch (_) {
            throw new HttpError('Invalid login', 403);
        }
    }
}
