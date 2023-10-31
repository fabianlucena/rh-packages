import {SwitchSiteService} from '../services/switch_site.js';
import {SessionSiteService} from '../services/session_site.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, httpErrorHandler} from 'http-util';
import {checkParameter, checkParameterUuid} from 'rf-util';

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

export class SwitchSiteController {
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
    static currentSiteGet(req, res) {
        const siteId = req?.site?.id;
        if (!siteId) {
            return res.status(204).send();
        }

        const definitions = {uuid: 'uuid', name: 'string'},
            options = {view: true, limit: 10, offset: 0};

        getOptionsFromParamsAndOData(req?.query, definitions, options)
            .then(options => SwitchSiteService.getForId(siteId, options))
            .then(element => res.status(200).send(element))
            .catch(httpErrorHandler(req, res));
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
    static async post(req, res) {
        const siteUuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('switchSite', 'UUID'));
        await SessionSiteService.createOrUpdate({
            sessionId: req?.session?.id,
            siteUuid,
        });
        res.status(204).send();
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
    static async get(req, res) {
        if ('$object' in req.query) {
            return SwitchSiteController.getObject(req, res);
        }

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
        if (!req.roles.includes('admin')) {
            options.where ??= {};
            options.where.name = req?.sites ?? null;
        }

        const result = await conf.global.services.Site.singleton().getListAndCount(options);
        
        res.status(200).send(result);
    }

    static async getObject(req, res) {
        checkParameter(req.query, '$object');

        const actions = [];
        //if (req.permissions.includes('site.create')) actions.push('create');
        //if (req.permissions.includes('site.edit'))   actions.push('enableDisable', 'edit');
        //if (req.permissions.includes('site.delete')) actions.push('delete');
        //actions.push('search', 'paginate');

        actions.push('select');
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('User'),
            load: {
                service: 'site',
                method: 'get',
            },
            actions: actions,
            properties: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._('Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._('Name'),
                },
                {
                    name: 'isEnabled',
                    type: 'boolean',
                    label: await loc._('Enabled'),
                },
                {
                    name: 'description',
                    type: 'text',
                    label: await loc._('Description'),
                },
            ]
        });
    }
}
