import {SiteService} from '../services/site.js';
import {SessionSiteService} from '../services/session_site.js';
import {getOptionsFromParamsAndODataAsync} from 'http-util';
import {checkParameter} from 'rofa-util';

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

/** 
 * @swagger
 * /api/current-site:
 *  get:
 *      tags:
 *          - Access
 *      summary: Sites
 *      description: Get he current site set for the logged user
 *      produces:
 *          -  application/json
 *      responses:
 *          '200':
 *              description: The current site
 *              schema:
 *                  $ref: '#/definitions/Site'
 *          '204':
 *              description: No current site selected
 *          '403':
 *              description: No session
 *              schema:
 *                  $ref: '#/definitions/Error'
 */
export function currentSiteGet(req, res) {
    const siteId = req?.site?.id;
    if (!siteId)
        return res.status(204).send();

    const definitions = {uuid: 'uuid', name: 'string'},
        options = {view: true, limit: 10, offset: 0};

    getOptionsFromParamsAndODataAsync(req?.query, definitions, options)
        .then(options => SiteService.getForId(siteId, options))
        .then(element => res.status(200).send(element));
}

/** 
 * @swagger
 * /api/switch-site:
 *  post:
 *      tags:
 *          - Access
 *      summary: Sites
 *      description: Switch the site for the logged user
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
export function switchSitePost(req, res) {
    checkParameter(req?.body, 'name')
        .then(siteName => SessionSiteService.createOrUpdate({
            sessionId: req?.session?.id,
            site: siteName,
        }))
        .then(() => res.status(204).send());
}

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
export async function siteGet(req, res) {
    const definitions = {uuid: 'uuid', name: 'string'},
        options = await getOptionsFromParamsAndODataAsync(req?.query, definitions, {view: true, limit: 10, offset: 0});

    const rows = await SiteService.getForUsername(req?.user?.username, options);
    res.status(200).send(rows);
}
