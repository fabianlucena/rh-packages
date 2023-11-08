import {TagService} from '../services/tag.js';
import {getOptionsFromParamsAndOData} from 'http-util';

/**
 * @swagger
 * definitions:
 *  Tag:
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

export class TagController {
    /** 
     * @swagger
     * /api/tag:
     *  get:
     *      tags:
     *          - Access
     *      summary: Tags
     *      description: Get tags available for the logged user
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Tag'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        if ('$grid' in req.query) {
            return TagController.getGrid(req, res);
        } else if ('$form' in req.query) {
            return TagController.getForm(req, res);
        }

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
        const rows = await TagService.singleton().getList(options);

        res.status(200).send(rows);
    }

    static async getGrid(req, res) {
        //checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('tag.create')) actions.push('create');
        if (req.permissions.includes('tag.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('tag.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('tag', 'Tags'),
            load: {
                service: 'tag',
                method: 'get',
            },
            actions: actions,
            columns: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._c('tag', 'Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._c('tag', 'Name'),
                },
                {
                    name: 'ownerDisplayName',
                    type: 'text',
                    label: await loc._c('tag', 'Owner'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        //checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._c('tag', 'Tags'),
            action: 'company',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._c('tag', 'Title'),
                    placeholder: await loc._c('tag', 'Title'),
                    required: true,
                    onValueChanged: {
                        mode: {
                            create: true,
                            defaultValue: false,
                        },
                        action: 'setValues',
                        override: false,
                        map: {
                            name: {
                                source: 'title',
                                sanitize: 'dasherize',
                            },
                        },
                    },
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._c('tag', 'Name'),
                    placeholder: await loc._c('tag', 'Name'),
                    required: true,
                    disabled: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._c('tag', 'Enabled'),
                    placeholder: await loc._c('tag', 'Enabled'),
                    value: true,
                },
                {
                    name: 'description',
                    type: 'textArea',
                    label: await loc._c('tag', 'Description'),
                    placeholder: await loc._c('tag', 'Description'),
                },
            ],
        });
    }
}