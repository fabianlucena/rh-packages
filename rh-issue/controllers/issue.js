import {IssueService} from '../services/issue.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError, getUuidFromRequest, makeContext} from 'http-util';
import {checkParameter, filterVisualItemsByAliasName} from 'rf-util';

const issueService = IssueService.singleton();

/**
 * @swagger
 * definitions:
 *  Issue:
 *      type: object
 *      properties:
 *          isEnabled:
 *              type: boolean
 *          name:
 *              type: string
 *              required: true
 *              example: admin
 *          title:
 *              type: string
 *              required: true
 *              example: Admin
 *          Project:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      required: true
 *                      example: admin
 *                  title:
 *                      type: string
 *                      required: true
 *                      example: Admin
 *          Type:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      required: true
 *                      example: admin
 *                  title:
 *                      type: string
 *                      required: true
 *                      example: Admin
 *          description:
 *              type: string
 *              required: true
 *              example: Admin
 *          Status:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      required: true
 *                      example: admin
 *                  title:
 *                      type: string
 *                      required: true
 *                      example: Admin
 *          Workflow:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      required: true
 *                      example: admin
 *                  title:
 *                      type: string
 *                      required: true
 *                      example: Admin
 */
    
export class IssueController {
    static async checkDataForProjectId(req, data) {
        if (!conf.filters?.getCurrentProjectId) {
            return data.projectId;
        }
         
        data ??= {};
        if (!data.projectId) {
            if (data.projectUuid) {
                data.projectId = await conf.global.services.Project.singleton().getIdForUuid(data.projectUuid);
            } else if (data.projectName) {
                data.projectId = await conf.global.services.Project.singleton().getIdForName(data.projectName);
            } else {
                data.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
                return data.projectId;
            }
        
            if (!data.projectId) {
                throw new _HttpError(req.loc._cf('issue', 'The project does not exist or you do not have permission to access it.'), 404);
            }
        }

        const projectId = await conf.filters.getCurrentProjectId(req) ?? null;
        if (data.projectId != projectId) {
            throw new _HttpError(req.loc._cf('issue', 'The project does not exist or you do not have permission to access it.'), 403);
        }

        return data.projectId;
    }

    static async checkUuid(req) {
        const uuid = await getUuidFromRequest(req);
        const issue = await issueService.getForUuid(uuid, {skipNoRowsError: true, loc: req.loc});
        if (!issue) {
            throw new _HttpError(req.loc._cf('issue', 'The issue with UUID %s does not exists.'), 404, uuid);
        }

        const projectId = await IssueController.checkDataForProjectId(req, {projectId: issue.projectId});

        return {uuid, projectId};
    }

    /**
     * @swagger
     * /api/issue:
     *  post:
     *      tags:
     *          - Issue
     *      summary: Create a issue
     *      description: Add a new issue to the database
     *      security:
     *          - bearerAuth: []
     *      produces:
     *          - application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Issue'
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
        checkParameter(req?.body, {name: loc._cf('issue', 'Name'), title: loc._cf('issue', 'Title')});
        
        const data = {...req.body};
        await IssueController.checkDataForProjectId(req, data);

        await issueService.create(data);

        res.status(204).send();
    }

    /**
     * @swagger
     * /api/issue:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get issue or a issue list
     *      description: If the UUID or name params is provided this endpoint returns a single issue otherwise returns a list of issues
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
     *                  $ref: '#/definitions/Issue'
     *          '204':
     *              description: Success no issue
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
            return IssueController.getGrid(req, res);
        } else if ('$form' in req.query) {
            return IssueController.getForm(req, res);
        }

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {
            view: true,
            limit: 10,
            offset: 0,
            includeProject: true,
            includeType: true,
            includePriority: true,
            includeStatus: true,
            includeWorkflow: true,
            includeCloseReason: true,
            loc: req.loc,
        };

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        if (conf.filters?.getCurrentProjectId) {
            options.where ??= {};
            options.where.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
        }

        await conf.global.eventBus?.$emit('Issue.response.getting', options);

        let result = await issueService.getListAndCount(options);

        await conf.global.eventBus?.$emit('Issue.response.getted', result, options);

        result = await issueService.sanitize(result);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('issue.create')) actions.push('create');
        if (req.permissions.includes('issue.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('issue.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        const loc = req.loc;
        const columns = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('issue', 'Title'),
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('issue', 'Name'),
            },
            {
                alias: 'project',
                name: 'Project.title',
                type: 'text',
                label: await loc._cf('issue', 'Project'),
            },
            {
                alias: 'type',
                name: 'Type.title',
                type: 'text',
                label: await loc._cf('issue', 'Type'),
            },
            {
                alias: 'priority',
                name: 'Priority.title',
                type: 'text',
                label: await loc._cf('issue', 'Priority'),
            },
            {
                alias: 'status',
                name: 'Status.title',
                type: 'text',
                label: await loc._cf('issue', 'Status'),
            },
        ];

        const details = [
            {
                name: 'description',
                type: 'text',
                label: await loc._cf('issue', 'Description'),
            },
            {
                alias: 'closeReason',
                name: 'CloseReason.title',
                type: 'text',
                label: await loc._cf('issue', 'Close reason'),
            },
            {
                alias: 'workflow',
                name: 'Workflow.title',
                type: 'text',
                label: await loc._cf('issue', 'Workflow'),
            },
        ];

        const grid = {
            title: await loc._('Issues'),
            load: {
                service: 'issue',
                method: 'get',
            },
            actions,
            columns: await filterVisualItemsByAliasName(columns, conf?.issue, {loc, entity: 'Issue', translationContext: 'issue', interface: 'grid'}),
            details: await filterVisualItemsByAliasName(details, conf?.issue, {loc, entity: 'Issue', translationContext: 'issue', interface: 'grid'}),
        };

        await conf.global.eventBus?.$emit('Issue.interface.grid.get', grid, {loc});
        await conf.global.eventBus?.$emit('interface.grid.get', grid, {loc, entity: 'Issue'});

        res.status(200).send(grid);
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        const loc = req.loc;
        const fields = [
            {
                name: 'title',
                type: 'text',
                label: await loc._cf('issue', 'Title'),
                placeholder: await loc._cf('issue', 'Title'),
                required: true,
                onValueChanged: {
                    mode: {
                        create: true,
                        defaultValue: false,
                    },
                    action: 'setValues',
                    override: false,
                    map: {
                        name: {
                            source: 'title',
                            sanitize: 'dasherize',
                        },
                    },
                },
            },
            {
                name: 'name',
                type: 'text',
                label: await loc._cf('issue', 'Name'),
                placeholder: await loc._cf('issue', 'Name'),
                required: true,
                disabled: {
                    create: false,
                    defaultValue: true,
                },
            },
            {
                alias: 'project',
                name: 'Project.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Project'),
                placeholder: await loc._cf('issue', 'Project'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/project',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                alias: 'type',
                name: 'Type.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Type'),
                placeholder: await loc._cf('issue', 'Type'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/type',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                alias: 'priority',
                name: 'Priority.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Priority'),
                placeholder: await loc._cf('issue', 'Priority'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/priority',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                name: 'isEnabled',
                type: 'checkbox',
                label: await loc._cf('issue', 'Enabled'),
                placeholder: await loc._cf('issue', 'Enabled'),
                value: true,
            },
            {
                name: 'description',
                type: 'textArea',
                label: await loc._cf('issue', 'Description'),
                placeholder: await loc._cf('issue', 'Description'),
            },
            {
                alias: 'status',
                name: 'Status.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Status'),
                placeholder: await loc._cf('issue', 'Status'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/status',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                alias: 'workflow',
                name: 'Workflow.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Workflow'),
                placeholder: await loc._cf('issue', 'Workflow'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/workflow',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
            {
                alias: 'closeReason',
                name: 'CloseReason.uuid',
                type: 'select',
                label: await loc._cf('issue', 'Close reason'),
                placeholder: await loc._cf('issue', 'Close reason'),
                required: true,
                loadOptionsFrom: {
                    service: 'issue/close-reason',
                    value: 'uuid',
                    text: 'title',
                    title: 'description',
                },
            },
        ];

        const form = {
            title: await loc._('Issues'),
            action: 'issue',
            fields: await filterVisualItemsByAliasName(fields, conf?.issue, {loc, entity: 'Issue', interface: 'form'}),
        };

        await conf.global.eventBus?.$emit('Issue.interface.form.get', form, {loc});
        await conf.global.eventBus?.$emit('interface.form.get', form, {loc, entity: 'Issue'});
        
        res.status(200).send(form);
    }

    /**
     * @swagger
     * /api/issue:
     *  delete:
     *      tags:
     *          - Issue
     *      summary: Delete a issue
     *      description: Delete a issue from its UUID
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
        const {uuid} = await this.checkUuid(req);

        const rowsDeleted = await issueService.deleteForUuid(uuid);
        if (!rowsDeleted) {
            throw new _HttpError(req.loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/issue/enable:
     *  post:
     *      tags:
     *          - Issue
     *      summary: Enable a issue
     *      description: Enable a issue from its UUID
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
        const {uuid} = await this.checkUuid(req);

        const rowsUpdated = await issueService.enableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/issue/disable:
     *  post:
     *      tags:
     *          - Issue
     *      summary: Disable a issue
     *      description: Disable a issue from its UUID
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
        const {uuid} = await this.checkUuid(req);

        const rowsUpdated = await issueService.disableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/issue:
     *  patch:
     *      tags:
     *          - Issue
     *      summary: Update a issue
     *      description: Update a issue from its UUID
     *      security:
     *          -   bearerAuth: []
     *      produces:
     *          -   application/json
     *      parameters:
     *          -  name: body
     *             in: body
     *             schema:
     *                $ref: '#/definitions/Issue'
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
        const {uuid, projectId} = await this.checkUuid(req);

        const data = {...req.body, uuid: undefined};
        const where = {uuid, projectId};

        const rowsUpdated = await issueService.updateFor(data, where, {context: makeContext(req, res)});
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('issue', 'Issue with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    /**
     * @swagger
     * /api/issue/project:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of projects available to select in a issue
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
    static async getProject(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        if (conf.filters?.getCurrentProjectId) {
            options.where ??= {};
            options.where.id = await conf.filters.getCurrentProjectId(req) ?? null;
        }

        const result = await conf.global.services.Project.singleton().getListAndCount(options);

        res.status(200).send(result);
    }

    /**
     * @swagger
     * /api/issue/type:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of types available to select in a issue
     *      description: If the UUID or name params is provided this endpoint returns a single type otherwise returns a list of types
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
     *                  $ref: '#/definitions/Type'
     *          '204':
     *              description: Success no type
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
    static async getType(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await conf.global.services.IssueType.singleton().getListAndCount(options);

        res.status(200).send(result);
    }

    /**
     * @swagger
     * /api/issue/priority:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of priorities available to select in a issue
     *      description: If the UUID or name params is provided this endpoint returns a single priority otherwise returns a list of priorities
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
     *                  $ref: '#/definitions/Priority'
     *          '204':
     *              description: Success no priority
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
    static async getPriority(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await conf.global.services.IssuePriority.singleton().getListAndCount(options);

        res.status(200).send(result);
    }

    /**
     * @swagger
     * /api/issue/status:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of statuses available to select in a issue
     *      description: If the UUID or name params is provided this endpoint returns a single status otherwise returns a list of statuses
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
     *                  $ref: '#/definitions/Status'
     *          '204':
     *              description: Success no status
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
    static async getStatus(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await conf.global.services.IssueStatus.singleton().getListAndCount(options);

        res.status(200).send(result);
    }
    
    /**
     * @swagger
     * /api/issue/workflow:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of workflows available to select in a issue
     *      description: If the UUID or name params is provided this endpoint returns a single workflow otherwise returns a list of workflows
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
     *                  $ref: '#/definitions/Workflow'
     *          '204':
     *              description: Success no workflow
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
    static async getWorkflow(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await conf.global.services.IssueWorkflow.singleton().getListAndCount(options);

        res.status(200).send(result);
    }

    /**
     * @swagger
     * /api/issue/close-reason:
     *  get:
     *      tags:
     *          - Issue
     *      summary: Get list of close reasons available to select in a issue
     *      description: If the UUID or name params is provided this endpoint returns a single close reason otherwise returns a list of close reasons
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
     *                  $ref: '#/definitions/CloseReason'
     *          '204':
     *              description: Success no close reason
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
    static async getCloseReason(req, res) {
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0, loc: req.loc};

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);
        const result = await conf.global.services.IssueCloseReason.singleton().getListAndCount(options);

        res.status(200).send(result);
    }
}