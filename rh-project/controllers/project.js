import {ProjectService} from '../services/project.js';
import {getOptionsFromParamsAndODataAsync, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUuid} from 'rf-util';

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
        const loc = req.loc;
        checkParameter(req?.body, {name: loc._f('Name'), title: loc._f('Title'), companyUuid: loc._f('Company')});
        checkParameterUuid(req?.body.companyUuid, loc._f('Company'));
        
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
        let options = {view: true, limit: 10, offset: 0, includeCompany: true, includeOwner: true};

        options = await getOptionsFromParamsAndODataAsync({...req.query, ...req.params}, definitions, options);
        const result = await ProjectService.getListAndCount(options);

        result.rows = result.rows.map(row => row.toJSON());

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('project.create')) actions.push('create');
        if (req.permissions.includes('project.edit'))   actions.push('enableDisable','edit');
        if (req.permissions.includes('project.delete')) actions.push('delete');
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
                    name: 'Company.title',
                    type: 'text',
                    label: await loc._('Company'),
                },
                {
                    name: 'Collaborators[0].User.displayName',
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
            title: await loc._('Projects'),
            action: 'project',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._('Title'),
                    placeholder: await loc._('Title'),
                    required: true,
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._('Name'),
                    placeholder: await loc._('Name'),
                    required: true,
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'companyUuid',
                    type: 'select',
                    label: await loc._('Company'),
                    placeholder: await loc._('Company'),
                    required: true,
                    loadOptionsFrom: {
                        service: 'company',
                        value: 'uuid',
                        text: 'title',
                        title: 'description',
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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._f('UUID'));
        const rowsDeleted = await ProjectService.deleteForUuid(uuid);
        if (!rowsDeleted)
            throw new _HttpError(req.loc._f('Project with UUID %s does not exists.'), 403, uuid);

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._f('UUID'));
        const rowsUpdated = await ProjectService.enableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._f('Project with UUID %s does not exists.'), 403, uuid);

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._f('UUID'));
        const rowsUpdated = await ProjectService.disableForUuid(uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._f('Project with UUID %s does not exists.'), 403, uuid);

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
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._f('UUID'));
        const rowsUpdated = await ProjectService.updateForUuid(req.body, uuid);
        if (!rowsUpdated)
            throw new _HttpError(req.loc._f('Project with UUID %s does not exists.'), 403, uuid);

        res.sendStatus(204);
    }
}