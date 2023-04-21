import {MenuItemService} from '../services/menu_item.js';
import {conf} from '../conf.js';

/**
 * @swagger
 * definitions:
 *  Menu:
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
            .then(rows => {
                const mil = rows.map(mi => {
                    mi = mi.toJSON();
                    mi.parent = mi.Parent?.name;
                    delete mi.Parent;

                    return mi;
                });

                res.status(200).send(mil);
            });
    }
}