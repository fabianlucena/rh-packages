import {conf} from '../conf.js';
import {getSingle, addEnabledFilter, includeCollaborators, completeIncludeOptions} from 'sql-util';
import {complete, deepComplete, _Error} from 'rf-util';
import {loc} from 'rf-locale';

export class ProjectService {
    /**
     * Completes the data object with the companyId property if not exists. 
     * @param {{company: string, companyUuis: string,  ...}} data 
     * @returns {Promise{data}}
     */
    static async completeCompanyId(data) {
        if (!data.companyId) {
            if (data.companyUuid)
                data.companyId = await conf.global.services.Company.getIdForUuid(data.companyUuid);
            else if (data.company)
                data.companyId = await conf.global.services.Company.getIdForName(data.company);
        }
        
        return data;
    }
    
    /**
     * Creates a new project row into DB. If no typeId provided or type, 'project' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, name: string, title: string}} data - data for the new Project.
     *  - name: must be unique.
     * @returns {Promise{Project}}
     */
    static async create(data) {
        await ProjectService.completeCompanyId(data);
        
        try {
            return await conf.global.sequelize.transaction(async t => {
                const project = await conf.global.models.Project.create(data, { transaction: t });
                if (data.owner || data.ownerId)
                    await conf.global.services.Share.create(
                        {
                            objectName: 'Project',
                            objectId: project.id,
                            userId: data.ownerId,
                            user: data.owner,
                            type: 'owner'
                        },
                        { transaction: t }
                    );

                return project;
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (!options)
            options = {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
        }

        if (options.includeCompany || options.where?.companyUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined)
                where = {isEnabled: options.isEnabled};

            if (options.where?.companyUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.companyUuid;
                delete options.where.companyUuid;
            }

            const attributes = options.includeCompany?
                ['uuid', 'name', 'title']:
                [];

            completeIncludeOptions(
                options,
                'Company',
                {
                    model: conf.global.models.Company,
                    attributes,
                    where,
                }
            );

            delete options.includeCompany;
        }

        if (options.includeOwner) {
            includeCollaborators(options, 'Project', conf.global.models, 'owner');
            delete options.includeOwner;
        }

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        return options;
    }

    /**
     * Gets a list of projects.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{ProjectList}}
     */
    static async getList(options) {
        return conf.global.models.Project.findAll(await ProjectService.getListOptions(options));
    }

    /**
     * Gets a list of projects and the rows count.
     * @param {Options} options - options for the @see sequelize.findAndCountAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{ProjectList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.Project.findAndCountAll(await ProjectService.getListOptions(options));
    }

    /**
     * Gets a project for its ID. For many coincidences and for no rows this method fails.
     * @param {integer} id - ID for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise[Project]}
     */
    static async get(id, options) {
        const rows = await ProjectService.getList(deepComplete(options, {where: {id}, limit: 2}));
        return getSingle(rows, {params: ['project', ['ID = %s', id], 'Project'], ...options});
    }

    /**
     * Gets a project for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Project}}
     */
    static async getForUuid(uuid, options) {
        const rows = await ProjectService.getList(deepComplete(options, {where: {uuid}, limit: 2}));
        return getSingle(rows, {params: ['project', ['UUID = %s', uuid], 'Project'], ...options});
    }

    /**
     * Gets a project ID for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the project to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForUuid(uuid, options) {
        return (await ProjectService.getForUuid(uuid, {...options, attributes: [...options?.attributes ?? [], 'id']})).id;
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
            throw new _Error(loc._f('Project "%s" does not exist'), name);

        if (!project.isEnabled)
            throw new _Error(loc._f('Project "%s" is not enabled'), name);
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
        await ProjectService.completeCompanyId(data);

        return conf.global.models.Project.update(data, {where:{uuid}});
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
    static async createIfNotExists(data, options) {
        const row = await ProjectService.getForName(data.name, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options});
        if (row)
            return row;

        return ProjectService.create(data);
    }

    static async getForCompanyId(companyId, options) {
        return ProjectService.getList({...options, where: {companyId}});
    }

    static async getIdForCompanyId(companyId, options) {
        const rows = await ProjectService.getForCompanyId(companyId, {...options, attributes:['id']});
        return rows.map(row => row.id);
    }
}