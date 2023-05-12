import {conf} from '../conf.js';
import {getSingle, addEnabledFilter, includeCollaborators} from 'sql-util';
import {complete, deepComplete, _Error} from 'rf-util';

export class CompanyService {
    /**
     * Creates a new company row into DB. If no typeId provided or type, 'company' type is used. If a password is provided also a local @ref Identity is created.
     * @param {{isEnabled: boolean, name: string, title: string}} data - data for the new Company.
     *  - name: must be unique.
     * @returns {Promise{Company}}
     */
    static async create(data) {
        try {
            return await conf.global.sequelize.transaction(async t => {
                const company = await conf.global.models.Company.create(data, { transaction: t });
                if (data.owner || data.ownerId)
                    await conf.global.services.Share.create(
                        {
                            objectName: 'Company',
                            objectId: company.id,
                            userId: data.ownerId,
                            user: data.owner,
                            type: 'owner'
                        },
                        { transaction: t }
                    );

                return company;
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
                options.attributes = ['uuid', 'isEnabled', 'name', 'title'];
        }

        if (options.includeOwner) {
            includeCollaborators(options, 'Company', conf.global.models, 'owner');
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
     * Gets a list of companies.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{CompanyList}}
     */
    static async getList(options) {
        return conf.global.models.Company.findAll(await CompanyService.getListOptions(options));
    }

    /**
     * Gets a list of companies and the rows count.
     * @param {Options} options - options for the @see sequelize.findAndCountAll method.
     *  - view: show visible peoperties.
     * @returns {Promise{CompanyList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.Company.findAndCountAll(await CompanyService.getListOptions(options));
    }

    /**
     * Gets a company for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the company to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Company}}
     */
    static getForUuid(uuid, options) {
        return CompanyService.getList(deepComplete(options, {where: {uuid}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['company', ['UUID = %s', uuid], 'Company']})));
    }

    /**
     * Gets a company ID for its UUID. For many coincidences and for no rows this method fails.
     * @param {string} uuid - UUID for the company to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForUuid(uuid, options) {
        return (await CompanyService.getForUuid(uuid, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Gets a company for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the company to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Company}}
     */
    static getForName(name, options) {
        return CompanyService.getList(deepComplete(options, {where: {name}, limit: 2}))
            .then(rowList => getSingle(rowList, complete(options, {params: ['company', ['name = %s', name], 'Company']})));
    }

    /**
     * Gets a company ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the company to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {ID}
     */
    static async getIdForName(name, options) {
        return (await CompanyService.getForName(name, deepComplete(options, {attributes: ['id']}))).id;
    }

    /**
     * Checks for an existent and enabled company. If the company exists and is enabled resolve, otherwise fail.
     * @param {Company} company - company model object to check.
     * @param {*string} name - name only for result message purpuose.
     * @returns 
     */
    static async checkEnabledCompany(company, name) {
        if (!company)
            throw new _Error('Company "%s" does not exist', name);

        if (!company.isEnabled)
            throw new _Error('Company "%s" is not enabled', name);
    }

    /**
     * Deletes a company for a given UUID.
     * @param {string} uuid - UUID for the company o delete.
     * @returns {Promise{Result}} deleted rows count.
     */
    static async deleteForUuid(uuid) {
        const id = await CompanyService.getIdForUuid(uuid);
        await conf.global.services.Share.deleteForObjectNameAndId('Company', id);

        return conf.global.models.Company.destroy({where:{id}});
    }

    /**
     * Updates a company.
     * @param {object} data - Data to update.
     * @param {object} uuid - UUID of the uer to update.
     * @returns {Promise{Result}} updated rows count.
     */
    static async updateForUuid(data, uuid) {
        return await conf.global.models.Company.update(data, {where:{uuid}});
    }

    /**
     * Enables a company for a given UUID.
     * @param {string} uuid - UUID for the company o enable.
     * @returns {Promise{Result}} enabled rows count.
     */
    static async enableForUuid(uuid) {
        return await CompanyService.updateForUuid({isEnabled: true}, uuid);
    }

    /**
     * Disables a company for a given UUID.
     * @param {string} uuid - UUID for the company o disable.
     * @returns {Promise{Result}} disabled rows count.
     */
    static async disableForUuid(uuid) {
        return await CompanyService.updateForUuid({isEnabled: false}, uuid);
    }
    
    /**
     * Creates a new Company row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    static createIfNotExists(data, options) {
        return CompanyService.getForName(data.name, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return CompanyService.create(data);
            });
    }
}