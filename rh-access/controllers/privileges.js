import {PrivilegesService} from '../services/privileges.js';
import {loc} from 'rf-locale';
import {errorHandler} from 'rf-util';

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
                        req.groups = privileges.groups;
                        req.permissions = privileges.permissions;
                    }
                        
                    next();
                })
                .catch(err => {
                    errorHandler(err, req.loc);
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
    static async get(req, res) {
        let result;

        if (req) {
            result = {
                username: req.user?.username ?? null,
                displayName: req.user?.displayName ?? null,
                site: req.site?.name ?? null,
                sites:  req.sites,
                roles: req.roles,
                groups: req.groups,
                permissions: req.permissions,
            };

            if (!req.site?.name)
                result.warning = await (req.loc ?? loc)._('No current site selected');
        } else
            result = {};

        res.status(200).send({count: 1, rows: [result]});
    }
}
