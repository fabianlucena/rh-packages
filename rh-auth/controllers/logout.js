import {LogoutService} from '../services/logout.js';

export class LogoutController {
    /** 
     * @swagger
     * /api/logout:
     *  get:
     *      tags:
     *          - Authorization
     *      summary: Logout
     *      description: Ends a session in the system
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          -  empty
     *      consumes:
     *          -  application/json
     *      parameters:
     *      responses:
     *          '204':
     *              description: Success
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        if (!req.session)
            return res.status(401).send({error: await req.locale._('No session')});

        LogoutService.logout(req.session)
            .then(() => {
                delete req.session;
                res.status(204).send();
            })
            .catch(error => res.status(500).send({error: error}));
    }
}