'use strict';

import {ProjectService} from '../services/project.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUuid, filterVisualItemsByAliasName} from 'rf-util';

/**
 * @swagger
 * definitions:
 *  Project:
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
    
export class ProjectController {
    static async checkDataForCompanyId(req, data) {
        if (!conf.filters?.getCurrentCompanyId)
            return;
            
        if (!data.companyId) {
            if (data.companyUuid)
                data.companyId = await conf.global.services.Company.singleton().getIdForUuid(data.companyUuid);
            else if (data.companyName)
                data.companyId = await conf.global.services.Company.singleton().getIdForName(data.companyName);
            else {
                data.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
                return data.companyId;
            }
        
            if (!data.companyId)
                throw new _HttpError(req.loc._cf('project', 'The company does not exist or you do not have permission to access it.'), 404);
        }

        const companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        if (data.companyId != companyId)
            throw new _HttpError(req.loc._cf('project', 'The company does not exist or you do not have permission to access it.'), 403);

        return data.companyId;
    }

    static async checkUuid(req, uuid) {
        const project = await ProjectService.getForUuid(uuid, {skipNoRowsError: true});
        if (!project)
            throw new _HttpError(req.loc._cf('project', 'The project with UUID %s does not exists.'), 404, uuid);

        return await ProjectController.checkDataForCompanyId(req, {companyId: project.companyId});
    }

    /**
     * @swagger
     * /api/project:
     *  post:
     *      tags:
     *          - Project
     *      summary: Create a project
     *      description: Add a new project to the database
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          - application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Project'
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
        checkParameter(req?.body, {name: loc._cf('project', 'Name'), title: loc._cf('project', 'Title')});
        
        const data = {...req.body};

        await ProjectController.checkDataForCompanyId(req, data);

        if (await ProjectService.getForName(data.name, {skipNoRowsError: true}))
            throw new ConflictError();

        if (!data.owner && !data.ownerId) {
            data.ownerId = req.user.id;
            if (!data.ownerId)
                throw new _HttpError(req.loc._cf('project', 'The project data does not have a owner.'));
        }

        await ProjectService.create(data);
        res.status(204).send();
    }

    /**
     * @swagger
     * /api/project:
     *  get:
     *      tags:
     *          - Project
     *      summary: Get project or a project list
     *      description: If the UUID or name params is provided this endpoint returns a single project otherwise returns a list of projects
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
     *                  $ref: '#/definitions/Project'
     *          '204':
     *              description: Success no project
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
            return ProjectController.getGrid(req, res);
        else if ('$form' in req.query)
            return ProjectController.getForm(req, res);

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, includeCompany: true};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        if (conf.filters?.getCurrentCompanyId) {
            options.where ??= {};
            options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
        }

        const result = await ProjectService.getListAndCount(options);

        result.rows = result.rows.map(row => {
            row = row.toJSON();
            row.companyUuid = row.Company.uuid;
            return row;
        });

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('project.create')) actions.push('create');
        if (req.permissions.includes('project.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('project.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        const loc = req.loc;
        const columns = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('project', 'Title'),
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('project', 'Name'),
            },
            {
                alias: 'company',
                name: 'Company.title',
                type: 'text',
                label: await loc._cf('project', 'Company'),
            },
            {
                alias: 'owner',
                name: 'Collaborators[0].User.displayName',
                type: 'text',
                label: await loc._cf('project', 'Owner'),
            },
        ];

        const grid = {
            title: await loc._('Projects'),
            load: {
                service: 'project',
                method: 'get',
            },
            actions,
            columns: await filterVisualItemsByAliasName(columns, conf?.project, {loc, entity: 'Project', translationContext: 'project', interface: 'grid'}),
        };

        await conf.global.eventBus?.$emit('project.interface.grid.get', grid, {loc});

        res.status(200).send(grid);
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        const loc = req.loc;
        const fields = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('project', 'Title'),
                placeholder: await loc._cf('project', 'Title'),
                required: true,
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('project', 'Name'),
                placeholder: await loc._cf('project', 'Name'),
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
                label: await loc._cf('project', 'Company'),
                placeholder: await loc._cf('project', 'Company'),
                required: true,
                loadOptionsFrom: {
                    service: 'project/company',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                name: 'isEnabled',
                type: 'checkbox',
                label: await loc._cf('project', 'Enabled'),
                placeholder: await loc._cf('project', 'Enabled'),
                value: true,
            },
            {
                name: 'description',
                type: 'textArea',
                label: await loc._cf('project', 'Description'),
                placeholder: await loc._cf('project', 'Description'),
            },
        ];

        const form = {
            title: await loc._('Projects'),
            action: 'project',
            fields: await filterVisualItemsByAliasName(fields, conf?.project, {loc, entity: 'Project', interface: 'form'}),
        };

        await conf.global.eventBus?.$emit('project.interface.form.get', form, {loc});
        
        res.status(200).send(form);
    }

    /**
     * @swagger
     * /api/project:
     *  delete:
     *      tags:
     *          - Project
     *      summary: Delete a project
     *      description: Delete a project from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('project', 'UUID'));
        await ProjectController.checkUuid(req, uuid);

        const rowsDeleted = await ProjectService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError(req.loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/project/enable:
     *  post:
     *      tags:
     *          - Project
     *      summary: Enable a project
     *      description: Enable a project from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('project', 'UUID'));
        await ProjectController.checkUuid(req, uuid);

        const rowsUpdated = await ProjectService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/project/disable:
     *  post:
     *      tags:
     *          - Project
     *      summary: Disable a project
     *      description: Disable a project from its UUID
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('project', 'UUID'));
        await ProjectController.checkUuid(req, uuid);

        const rowsUpdated = await ProjectService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/project:
     *  patch:
     *      tags:
     *          - Project
     *      summary: Update a project
     *      description: Update a project from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Project'
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('project', 'UUID'));
        await ProjectController.checkUuid(req, uuid);

        const rowsUpdated = await ProjectService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._cf('project', 'Project with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/project/company:
     *  get:
     *      tags:
     *          - Project
     *      summary: Get list of companies available to select in a project
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