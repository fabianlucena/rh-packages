import {BranchService} from '../services/branch.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUuid, filterVisualItemsByAliasName} from 'rf-util';

const branchService = BranchService.singleton();

/**
 * @swagger
 * definitions:
 *  Branch:
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
    
export class BranchController {
    static async checkDataForCompanyId(req, data) {
        if (!conf.filters?.getCurrentCompanyId) {
            return;
        }
            
        if (!data.companyId) {
            if (data.companyUuid) {
                data.companyId = await conf.global.services.Company.singleton().getIdForUuid(data.companyUuid);
            } else if (data.companyName) {
                data.companyId = await conf.global.services.Company.singleton().getIdForName(data.companyName);
            } else {
                data.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
                return data.companyId;
            }
        
            if (!data.companyId) {
                throw new _HttpError(req.loc._cf('branch', 'The company does not exist or you do not have permission to access it.'), 404);
            }
        }

        const companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        if (data.companyId != companyId) {
            throw new _HttpError(req.loc._cf('branch', 'The company does not exist or you do not have permission to access it.'), 403);
        }

        return data.companyId;
    }

    static async checkUuid(req, uuid) {
        const branch = await branchService.getForUuid(uuid, {skipNoRowsError: true});
        if (!branch) {
            throw new _HttpError(req.loc._cf('branch', 'The branch with UUID %s does not exists.'), 404, uuid);
        }

        return await BranchController.checkDataForCompanyId(req, {companyId: branch.companyId});
    }

    /**
     * @swagger
     * /api/branch:
     *  post:
     *      tags:
     *          - Branch
     *      summary: Create a branch
     *      description: Add a new branch to the database
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          - application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Branch'
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
        const loc = req.loc;
        checkParameter(req?.body, {name: loc._cf('branch', 'Name'), title: loc._cf('branch', 'Title')});
        
        const data = {...req.body};

        await BranchController.checkDataForCompanyId(req, data);

        if (await branchService.getForName(data.name, {skipNoRowsError: true})) {
            throw new ConflictError();
        }

        if (!data.owner && !data.ownerId) {
            data.ownerId = req.user.id;
            if (!data.ownerId) {
                throw new _HttpError(req.loc._cf('branch', 'The branch data does not have a owner.'));
            }
        }

        await branchService.create(data);
        res.status(204).send();
    }

    /**
     * @swagger
     * /api/branch:
     *  get:
     *      tags:
     *          - Branch
     *      summary: Get branch or a branch list
     *      description: If the UUID or name params is provided this endpoint returns a single branch otherwise returns a list of branches
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
     *                  $ref: '#/definitions/Branch'
     *          '204':
     *              description: Success no branch
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
        if ('$grid' in req.query) {
            return BranchController.getGrid(req, res);
        } else if ('$form' in req.query) {
            return BranchController.getForm(req, res);
        }

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, includeCompany: true};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        if (conf.filters?.getCurrentCompanyId) {
            options.where ??= {};
            options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        }

        await conf.global.eventBus?.$emit('branch.response.getting', options);

        const result = await branchService.getListAndCount(options);

        result.rows = result.rows.map(row => {
            if (row.toJSON) {
                row = row.toJSON();
            }

            row.companyUuid = row.Company.uuid;
            return row;
        });

        await conf.global.eventBus?.$emit('branch.response.getted', result, options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('branch.create')) actions.push('create');
        if (req.permissions.includes('branch.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('branch.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        const loc = req.loc;
        const columns = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('branch', 'Title'),
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('branch', 'Name'),
            },
            {
                alias: 'company',
                name: 'Company.title',
                type: 'text',
                label: await loc._cf('branch', 'Company'),
            },
            {
                alias: 'owner',
                name: 'Collaborators[0].User.displayName',
                type: 'text',
                label: await loc._cf('branch', 'Owner'),
            },
        ];

        const grid = {
            title: await loc._('Branches'),
            load: {
                service: 'branch',
                method: 'get',
            },
            actions,
            columns: await filterVisualItemsByAliasName(columns, conf?.branch, {loc, entity: 'Branch', translationContext: 'branch', interface: 'grid'}),
        };

        await conf.global.eventBus?.$emit('branch.interface.grid.get', grid, {loc});

        res.status(200).send(grid);
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        const loc = req.loc;
        const fields = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('branch', 'Title'),
                placeholder: await loc._cf('branch', 'Title'),
                required: true,
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('branch', 'Name'),
                placeholder: await loc._cf('branch', 'Name'),
                required: true,
                readonly: {
                    create: false,
                    defaultValue: true,
                },
            },
            {
                alias: 'company',
                name: 'companyUuid',
                type: 'select',
                label: await loc._cf('branch', 'Company'),
                placeholder: await loc._cf('branch', 'Company'),
                required: true,
                loadOptionsFrom: {
                    service: 'branch/company',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                name: 'isEnabled',
                type: 'checkbox',
                label: await loc._cf('branch', 'Enabled'),
                placeholder: await loc._cf('branch', 'Enabled'),
                value: true,
            },
            {
                name: 'description',
                type: 'textArea',
                label: await loc._cf('branch', 'Description'),
                placeholder: await loc._cf('branch', 'Description'),
            },
        ];

        const form = {
            title: await loc._('Branches'),
            action: 'branch',
            fields: await filterVisualItemsByAliasName(fields, conf?.branch, {loc, entity: 'Branch', translationContext: 'branch', interface: 'form'}),
        };

        await conf.global.eventBus?.$emit('branch.interface.form.get', form, {loc});
        
        res.status(200).send(form);
    }

    /**
     * @swagger
     * /api/branch:
     *  delete:
     *      tags:
     *          - Branch
     *      summary: Delete a branch
     *      description: Delete a branch from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
        await BranchController.checkUuid(req, uuid);

        const rowsDeleted = await branchService.deleteForUuid(uuid);
        if (!rowsDeleted) {
            throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/branch/enable:
     *  post:
     *      tags:
     *          - Branch
     *      summary: Enable a branch
     *      description: Enable a branch from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
        await BranchController.checkUuid(req, uuid);

        const rowsUpdated = await branchService.enableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/branch/disable:
     *  post:
     *      tags:
     *          - Branch
     *      summary: Disable a branch
     *      description: Disable a branch from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
        await BranchController.checkUuid(req, uuid);

        const rowsUpdated = await branchService.disableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/branch:
     *  patch:
     *      tags:
     *          - Branch
     *      summary: Update a branch
     *      description: Update a branch from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Branch'
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('branch', 'UUID'));
        await BranchController.checkUuid(req, uuid);

        const rowsUpdated = await branchService.updateForUuid(req.body, uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('branch', 'Branch with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/branch/company:
     *  get:
     *      tags:
     *          - Branch
     *      summary: Get list of companies available to select in a branch
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
    static async getCompany(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        if (conf.filters?.getCurrentCompanyId) {
            options.where ??= {};
            options.where.id = await conf.filters.getCurrentCompanyId(req) ?? null;
        }

        const result = await conf.global.services.Company.singleton().getListAndCount(options);

        const loc = req.loc;
        result.rows = result.rows.map(row => {
            row = row.toJSON();

            if (row.isTranslatable) {
                row.title = loc._(row.title);
                row.description = loc._(row.description);
                delete row.isTranslatable;
            }

            return row;
        });

        res.status(200).send(result);
    }
}