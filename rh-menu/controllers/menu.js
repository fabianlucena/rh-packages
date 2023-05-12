import {MenuItemService} from '../services/menu_item.js';
import {conf} from '../conf.js';
import {runSequentially} from 'rf-util';

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
    static get(req, res) {
        const permissions = req?.permissions;
        const options = {
            view: true,
            include: [
                {
                    model: conf.global.models.Permission,
                    where: {name: permissions},
                }
            ]
        };

        MenuItemService.getList(options)
            .then(async rows => {
                const loc = req.loc;
                const mil = await runSequentially(rows, async mir => {
                    let mi = mir.toJSON();
                    if (mi.Parent) {
                        mi.parent = mi.Parent?.name;
                        delete mi.Parent;
                    }

                    if (mi.jsonData) {
                        if (mi.data)
                            mi = {...mi, Parent: undefined, data: undefined, ...mi.data};

                        delete mi.jsonData;
                    }

                    if (mi.isTranslatable && mi.label)
                        mi.label = await loc._d('menu', mi.label);

                    return mi;
                });

                res.status(200).send(mil);
            });
    }
}