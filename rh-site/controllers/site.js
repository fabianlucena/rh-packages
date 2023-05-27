'use strict';

import {SiteService} from '../services/site.js';
import {getOptionsFromParamsAndODataAsync} from 'http-util';

/**
 * @swagger
 * definitions:
 *  Site:
 *      properties:
 *          name:
 *              type: string
 *          title:
 *              type: integer
 *  Error:
 *      properties:
 *          error:
 *              name: string
 *              example: Example error
 */

export class SiteController {
    /** 
     * @swagger
     * /api/site:
     *  get:
     *      tags:
     *          - Access
     *      summary: Sites
     *      description: Get sites available for the logged user
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Site'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = getOptionsFromParamsAndODataAsync(req?.query, definitions, options);
        const rows = await SiteService.getList(options);

        res.status(200).send(rows);
    }
}