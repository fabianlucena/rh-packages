import {ProjectService} from '../services/project.js';
import {getOptionsFromParamsAndODataAsync, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUUID} from 'rf-util';

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
        checkParameter(req?.body, 'name', 'title');
        if (await ProjectService.getForName(req.body.name, {skipNoRowsError: true}))
            throw new ConflictError();

        const data = {...req.body};
        if (!data.owner && !data.ownerId) {
            data.ownerId = req.user.id;
            if (!data.ownerId)
                throw new _HttpError(req.loc._f('The project data does not have a owner.'));
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
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);
        options.withCount = true;
        const result = await ProjectService.getList(options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('project.create')) actions.push('create');
        if (req.permissions.includes('project.delete')) actions.push('delete');
        if (req.permissions.includes('project.edit'))   actions.push('edit', 'enable', 'disable');

        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('Projects'),
            load: {
                service: 'project',
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
                    name: 'isEnabled',
                    type: 'bool',
                    label: await loc._('Enabled'),
                }
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._('Projects'),
            action: 'project',
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
            ],
        });
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
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsDeleted = await ProjectService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError('Project with UUID %s does not exists.', 403, uuid);

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
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await ProjectService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('Project with UUID %s does not exists.', 403, uuid);

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
        const uuid = await checkParameterUUID({...req.query, ...req.params, ...req.body}, 'uuid');
        const rowsUpdated = await ProjectService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError('Project with UUID %s does not exists.', 403, uuid);

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
        const uuid = await checkParameterUUID({...req.body, ...req.params}, 'uuid');
        const rowsUpdated = await ProjectService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError('Project with UUID %s does not exists.', 403, uuid);

        res.sendStatus(204);
    }
}