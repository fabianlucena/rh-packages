import {httpErrorHandlerAsync} from 'http-util';

export class PrivilegesController
{
    /*static configureMiddleware() {
        return (req, res, next) => {
            PrivilegesService.getJSONForUsernameAndSessionIdCached(req?.user.username, req?.session?.id)
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
    }*/

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
        //const definitions = {};
        //let options = {view: true, limit: 10, offset: 0};

        try {
            const result = {
                sites: req?.sites,
            };

            if (req?.site?.name) {
                result.site = req?.site?.name;
                result.roles = req?.roles;
                result.permissions = req?.permissions;
            } else
                result.warning = await req.locale._('No current site selected');

            res.status(200).send(result);
        } catch(error) {
            httpErrorHandlerAsync(req, res)(error);
        }
    }
}