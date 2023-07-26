'use strict';

import {ProjectTagService} from '../services/project_tag.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData} from 'http-util';

/**
 * @swagger
 * definitions:
 *  projectTag:
 *      properties:
 *          name:
 *              type: string
 *  Error:
 *      properties:
 *          error:
 *              name: string
 *              example: Example error
 */

const projectTagService = ProjectTagService.singleton();

export class projectTagController {
    /** 
     * @swagger
     * /api/project-tag:
     *  get:
     *      tags:
     *          - projectTag
     *      summary: projectTag
     *      description: Get the tags for the gfiven criteria
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/projectTag'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        const defaultOptions = {
            view: true,
            limit: 10,
            offset: 0,
            includeTags: true,
            attributes: [],
            where: {},
        };
        const options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, null, defaultOptions);
        if (options.limit > 20)
            options.limit = 20;
        options.where.tagCategory = conf.tagCategory;

        const result = await projectTagService.getListAndCount(options);
        result.rows = result.rows.map(row => {
            if (row.toJSON)
                row = row.toJSON();
            return row.Tag;
        });

        res.status(200).send(result);
    }
}