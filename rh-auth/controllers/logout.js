'use strict';

import {LogoutService} from '../services/logout.js';
import {conf} from '../conf.js';

export class LogoutController {
    /** 
     * @swagger
     * /api/logout:
     *  post:
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
    static async post(req, res) {
        if (!req.session) {
            res.status(401).send({error: await req.loc._c('logout', 'No session')});
            conf.global?.log.info('Error to logout no session.');

        }

        await LogoutService.singleton().logout(req.session);
        await conf.global.eventBus?.$emit('logout', req.session.id);
        conf.global?.log.info('Logout session closed.', {sessionId: req.session.id});

        delete req.session;
        res.status(204).send();
    }
}