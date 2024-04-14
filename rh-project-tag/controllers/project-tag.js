import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData } from 'http-util';

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

const tagService = conf.global.services.Tag.singleton();

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
  static async getTags(req, res) {
    const defaultOptions = {
      view: true,
      limit: 20,
      offset: 0,
      attributes: ['name'],
      where: { isEnabled: true },
    };
    const options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, null, defaultOptions);
    options.where.tagCategory = conf.tagCategory;

    const result = await tagService.getListAndCount(options);

    res.status(200).send(result);
  }
}