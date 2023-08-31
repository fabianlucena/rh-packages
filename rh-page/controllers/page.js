'use strict';

import {PageService} from '../services/page.js';

/**
 * @swagger
 * definitions:
 *  Page:
 *      properties:
 *          uuid:
 *              type: UUID
 *          isEnabled:
 *              type: boolean
 *          name:
 *              type: string
 *          label:
 *              type: integer
 *          isTranslatable:
 *              type: boolean
 *          translationContext:
 *              type: string
 *          title:
 *              type: string
 *          content:
 *              type: string
 * 
 *  Error:
 *      properties:
 *          error:
 *              name: string
 *              example: Example error
 */

const page = PageService.singleton();

export class PageController {
    /** 
     * @swagger
     * /api/page:
     *  get:
     *      tags:
     *          - Page
     *      summary: Page
     *      description: Get the page for the given name
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Page'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        const options = {view: true};

        const result = await page.getListAndCount(options);
        if (!result?.count) {
            res.status(404).send('Topic not found');
            return;
        }
        
        res.status(200).send(result);
    }
}