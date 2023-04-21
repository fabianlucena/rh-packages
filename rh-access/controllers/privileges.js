import {PrivilegesService} from '../services/privileges.js';
import {errorHandlerAsync} from 'rofa-util';

/**
 * @swagger
 * definitions:
 *  Privileges:
 *      properties:
 *          userId:
 *              type: string
 *          typeId:
 *              type: integer
 *          data:
 *              type: JSON
 *  Error:
 *      properties:
 *          error:
 *              type: string
 *              example: Example error
 */

export class PrivilegesController {
    static middleware() {
        return (req, res, next) => {
            PrivilegesService.getJSONForUsernameAndSessionIdCached(req?.user?.username, req?.session?.id)
                .then(privileges => {
                    if (privileges) {
                        req.sites = privileges.sites;
                        req.site = privileges.site;
                        req.roles = privileges.roles;
                        req.permissions = privileges.permissions;
                    }
                        
                    next();
                })
                .catch(err => {
                    errorHandlerAsync(err);
                    next();
                });
        };
    }

    /** 
     * @swagger
     * /api/privilege:
     *  get:
     *      tags:
     *          - Access
     *      summary: Login
     *      description: Get privileges for the logged user
     *      produces:
     *          -  application/json
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Privileges'
     *          '403':
     *              description: No session
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async privilegesGet(req, res) {
        const result = {
            sites: req?.sites,
        };

        result.site = req?.site?.name ?? null;
        result.roles = req?.roles;
        result.permissions = req?.permissions;

        if (!req?.site?.name)
            result.warning = await req.locale._('No current site selected');

        res.status(200).send(result);
    }
}
