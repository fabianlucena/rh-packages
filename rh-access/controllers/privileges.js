const PrivilegeService = require('../services/privileges');
const httpUtil = require('http-util');

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
async function privilegesGet(req, res) {
    const definitions = {};
    let options = {view: true, limit: 10, offset: 0};

    try {
        options = await httpUtil.getOptionsFromParamsAndOData(req?.query, definitions, options);
        options.locale = req.locale;
        const result = await PrivilegeService.getForUsernameAndSiteName(req?.user?.username, req?.site?.name, options);
        res.status(200).send(result);
    } catch(error) {
        httpUtil.errorHandler(req, res)(error);
    }
}

module.exports = {
    privilegesGet: privilegesGet,
};