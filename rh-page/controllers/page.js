import { PageService } from '../services/page.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { defaultLoc } from 'rf-locale';

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
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    const options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params },
      definitions,
      {
        view: true,
        limit: 10,
        offset: 0,
        includeCompany: true,
      },
    );

    const result = await page.getListAndCount(options);
    if (!result?.count) {
      throw new _HttpError(loc._cf('page', 'Page not found.'), 404);
    }

    result.rows = result.rows.map(row => {
      if (row.Format?.name) {
        row.format = row.Format?.name;
      }

      return row;
    });
        
    res.status(200).send(result);
  }
}