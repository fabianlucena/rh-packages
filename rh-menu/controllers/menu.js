import {MenuItemService} from '../services/menu_item.js';
import {conf} from '../conf.js';
import {runSequentially} from 'rf-util';
import {defaultLoc} from 'rf-locale';

/**
 * @swagger
 * definitions:
 *  Menu:
 *      properties:
 *          name:
 *              type: string
 *          label:
 *              type: integer
 *  Error:
 *      properties:
 *          error:
 *              name: string
 *              example: Example error
 */

export class MenuController {
    /** 
     * @swagger
     * /api/menu:
     *  get:
     *      tags:
     *          - Menu
     *      summary: Menu
     *      description: Get the menu for the logged user
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Menu'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        const permissions = req?.permissions;
        const options = {
            view: true,
            include: [
                {
                    model: conf.global.models.Permission,
                    where: {name: permissions},
                }
            ],
            includeParentAsMenuItem: true,
        };

        const rows = await MenuItemService.singleton().getList(options);
        const loc = req.loc ?? defaultLoc;
        let menu = await runSequentially(rows, async mi => {
            if (mi.Parent) {
                mi.parent = mi.Parent?.name;
                delete mi.Parent;
            }

            if (mi.data) {
                mi = {...mi, data: undefined, ...mi.data};
            }

            if (mi.jsonData) {
                delete mi.jsonData;
            }

            if (mi.isTranslatable) {
                if (mi.label) {
                    mi.label = await loc._c(mi.translationContext ?? 'menu', mi.label);
                }

                delete mi.isTranslatable;
                delete mi.translationContext;
            }

            if (mi.alias) {
                mi.name = mi.alias;
                delete mi.alias;
            }

            return mi;
        });

        const data = {menu};
        await conf.global.eventBus?.$emit('menuGet', data, {loc, sessionId: req.session?.id, params: req.query});
        await conf.global.eventBus?.$emit('menuFilter', data, {loc, sessionId: req.session?.id, params: req.query});

        res.status(200).send(data);
    }
}