import {CompanyService} from '../services/company.js';
import {getOptionsFromParamsAndODataAsync, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUuid} from 'rf-util';

/**
 * @swagger
 * definitions:
 *  Company:
 *      type: object
 *      properties:
 *          name:
 *              type: string
 *              required: true
 *              example: admin
 *          title:
 *              type: string
 *              required: true
 *              example: Admin
 *          typeId:
 *              type: integer
 *          isEnabled:
 *              type: boolean
 */
    
export class CompanyController {
    /**
     * @swagger
     * /api/company:
     *  post:
     *      tags:
     *          - Company
     *      summary: Create a company
     *      description: Add a new company to the database
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          - application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Company'
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '400':
     *              description: Missing parameters
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async post(req, res) {
        checkParameter(req?.body, {name: () => loc._('Name'), title: () => loc._('Title')});
        if (await CompanyService.getForName(req.body.name, {skipNoRowsError: true}))
            throw new ConflictError();

        const data = {...req.body};
        if (!data.owner && !data.ownerId) {
            data.ownerId = req.user.id;
            if (!data.ownerId)
                throw new _HttpError(req.loc._f('The company data does not have a owner.'));
        }

        await CompanyService.create(data);
        res.status(204).send();
    }

    /**
     * @swagger
     * /api/company:
     *  get:
     *      tags:
     *          - Company
     *      summary: Get company or a company list
     *      description: If the UUID or name params is provided this endpoint returns a single company otherwise returns a list of companies
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
     *          -   name: name
     *              in: query
     *              type: string
     *              example: admin
     *          -   name: limit
     *              in: query
     *              type: int
     *          -   name: offset
     *              in: query
     *              type: int
     *      responses:
     *          '200':
     *              description: Success
     *              schema:
     *                  $ref: '#/definitions/Company'
     *          '204':
     *              description: Success no company
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async get(req, res) {
        if ('$grid' in req.query)
            return CompanyController.getGrid(req, res);
        else if ('$form' in req.query)
            return CompanyController.getForm(req, res);
            
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, includeOwner: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);
        const result = await CompanyService.getListAndCount(options);

        result.rows = result.rows.map(row => {
            row = row.toJSON();
            return {
                ...row,
                ownerDisplayName: row.Collaborators[0].User?.displayName ?? null
            };
        });

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('company.create')) actions.push('create');
        if (req.permissions.includes('company.edit'))   actions.push('enableDisable','edit');
        if (req.permissions.includes('company.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('Companies'),
            load: {
                service: 'company',
                method: 'get',
            },
            actions: actions,
            columns: [
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
                    name: 'ownerDisplayName',
                    type: 'text',
                    label: await loc._('Owner'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._('Companies'),
            action: 'company',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._('Title'),
                    placeholder: await loc._('Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._('Name'),
                    placeholder: await loc._('Name'),
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._('Enabled'),
                    placeholder: await loc._('Enabled'),
                    value: true,
                },
                {
                    name: 'description',
                    type: 'textArea',
                    label: await loc._('Description'),
                    placeholder: await loc._('Description'),
                },
            ],
        });
    }

    /**
     * @swagger
     * /api/company:
     *  delete:
     *      tags:
     *          - Company
     *      summary: Delete a company
     *      description: Delete a company from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
     *      responses:
     *          '204':
     *              description: Success
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async delete(req, res) {
        const uuid = await checkParameterUuid({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsDeleted = await CompanyService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError('Company with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/company/enable:
     *  post:
     *      tags:
     *          - Company
     *      summary: Enable a company
     *      description: Enable a company from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
     *      responses:
     *          '204':
     *              description: Success
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async enablePost(req, res) {
        const uuid = await checkParameterUuid({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await CompanyService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('Company with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/company/disable:
     *  post:
     *      tags:
     *          - Company
     *      summary: Disable a company
     *      description: Disable a company from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -   name: uuid
     *              in: query
     *              type: string
     *              format: UUID
     *              required: true
     *              example: 018DDC35-FB33-415C-B14B-5DBE49B1E9BC
     *      responses:
     *          '204':
     *              description: Success
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async disablePost(req, res) {
        const uuid = await checkParameterUuid({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await CompanyService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('Company with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/company:
     *  patch:
     *      tags:
     *          - Company
     *      summary: Update a company
     *      description: Update a company from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Company'
     *      responses:
     *          '204':
     *              description: Success
     *          '400':
     *              description: Missing parameters or parameters error
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '401':
     *              description: Unauthorized
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '403':
     *              description: Forbidden
     *              schema:
     *                  $ref: '#/definitions/Error'
     *          '500':
     *              description: Internal server error
     *              schema:
     *                  $ref: '#/definitions/Error'
     */
    static async patch(req, res) {
        const uuid = await checkParameterUuid({...req.body, ...req.params}, 'uuid');
        const rowsUpdated = await CompanyService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError('Company with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }
}