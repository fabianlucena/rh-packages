import {conf} from '../conf.js';
import {getSingle, addSimpleEnabledFilter} from 'sql-util';
import {complete, deepComplete, _Error} from 'rf-util';
import {Op} from 'sequelize';

export class ProjectService {
    /**
     * Creates a new project row into DB. If no typeId provided or type, 'project' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, name: string, title: string}} data - data for the new Project.
     *  - name: must be unique.
     * @returns {Promise{Project}}
     */
    static async create(data) {
        if (data.type)
            data.type = 'project';

        const project = await conf.global.models.Project.create(data);

        if (data.owner || data.ownerId)
            await conf.global.services.Share.create({objectName: 'Project', objectId: project.id, userId: data.ownerId, user: data.owner, type: 'owner'});

        return project;
    }

    /**
     * Gets a list of projects.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{ProjectList}]
     */
    static async getList(options) {
        options = deepComplete(options);
        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'name', 'title'];
        }

        if (options.q) {
            const q = `%${options.q}%`;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ]
            }
        }

        return conf.global.models.Project.findAll(options);
    }

    /**
     * Gets a list of enabled projects.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{ProjectList}]
     */
    static async getEnabledList(options) {
        return ProjectService.getList(addSimpleEnabledFilter(options, true));
    }

    /**
     * Gets a project for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Project}}
     */
    static getForUuid(uuid, options) {
        return ProjectService.getList(deepComplete(options, {where: {uuid: uuid}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['project', ['UUID = %s', uuid], 'Project']})));
    }

    /**
     * Gets a project ID for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForUuid(uuid, options) {
        return (await ProjectService.getForUuid(uuid, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Gets a project for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Project}}
     */
    static getForName(name, options) {
        return ProjectService.getList(deepComplete(options, {where: {name}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['project', ['name = %s', name], 'Project']})));
    }

    /**
     * Gets a project ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForName(name, options) {
        return (await ProjectService.getForName(name, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Checks for an existent and enabled project. If the project exists and is enabled resolve, otherwise fail.
     * @param {Project} project - project model object to check.
     * @param {*string} name - name only for result message purpuose.
     * @returns 
     */
    static async checkEnabledProject(project, name) {
        if (!project)
            throw new _Error('Project "%s" does not exist', name);

        if (!project.isEnabled)
            throw new _Error('Project "%s" is not enabled', name);
    }

    /**
     * Deletes a project for a given UUID.
     * @param {string} uuid - UUID for the project o delete.
     * @returns {Promise{Result}} deleted rows count.
     */
    static async deleteForUuid(uuid) {
        const id = await ProjectService.getIdForUuid(uuid);
        await conf.global.services.Share.deleteForObjectNameAndId('Project', id);

        return conf.global.models.Project.destroy({where:{id}});
    }

    /**
     * Updates a project.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise{Result}} updated rows count.
     */
    static async updateForUuid(data, uuid) {
        return await conf.global.models.Project.update(data, {where:{uuid: uuid}});
    }

    /**
     * Enables a project for a given UUID.
     * @param {string} uuid - UUID for the project o enable.
     * @returns {Promise{Result}} enabled rows count.
     */
    static async enableForUuid(uuid) {
        return await ProjectService.updateForUuid({isEnabled: true}, uuid);
    }

    /**
     * Disables a project for a given UUID.
     * @param {string} uuid - UUID for the project o disable.
     * @returns {Promise{Result}} disabled rows count.
     */
    static async disableForUuid(uuid) {
        return await ProjectService.updateForUuid({isEnabled: false}, uuid);
    }
    
    /**
     * Creates a new Project row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static createIfNotExists(data, options) {
        return ProjectService.getForName(data.name, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return ProjectService.create(data);
            });
    }
}