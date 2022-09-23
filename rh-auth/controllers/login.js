const LoginService = require('../services/login');
const httpUtil = require('http-util');

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

function loginGetForm(req, res) {
    if (req.query.$form !== undefined) {
        res.status(200).send({
            username: {
                type: 'text',
                label: _('Username')
            },
            password: {
                type: 'password',
                label: _('Password')
            }
        });
    } else {
        res.status(400).send({error: '400 Bad Request'});
    }
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
 *              description: Invalid credentials, failed login, or other error
 *              schema:
 *                  $ref: '#/definitions/Error'
 */
async function loginPost(req, res) {
    if (!req.body || typeof req.body != 'object')
        return res.status(400).send({error: await req.locale._('No login data')});
        
    if (!req.body.username)
        return res.status(400).send({error: await req.locale._('No username')});
        
    if (!req.body.password)
        return res.status(400).send({error: await req.locale._('No password')});
    
    LoginService.loginForUsernamePasswordAndDeviceId(req?.body?.username, req?.body?.password, req?.device?.id, req?.sessionIndex, req.locale)
        .then(session => {
            req.session = session;
            res.header('Authorization', 'Bearer ' + session.authToken);
            res.status(201).send({
                index: session.index,
                authToken: session.authToken,
            });
        })
        .catch(httpUtil.errorHandler(req, res, 403));
}

module.exports = {
    loginGetForm: loginGetForm,
    loginPost: loginPost
};