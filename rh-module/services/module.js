import {conf} from '../conf.js';
import {checkDataForMissingProperties, addEnabledFilter, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class ModuleService {
    /**
     * Creates a new Module row into DB.
     * @param {{
     *  name: string,
     *  title: string,
     * }} data - data for the new Module.
     *  - name must be unique.
     * @returns {Promise{Module}}
     */
    static async create(data) {
        await checkDataForMissingProperties(data, 'Module', 'name', 'title');
        return conf.global.models.Module.create(data);
    }

    /**
     * Creates a new Module row into DB if not exists.
     * @param {data} data - data for the new Module @see ModuleService.create.
     * @returns {Promise{Module}}
     */
    static async createIfNotExists(data, options) {
        const element = await ModuleService.getForName(data.name, {attributes: ['id'], skipNoRowsError: true, ...options});
        if (element)
            return element;

        return ModuleService.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        return options;
    }

    /**
     * Gets a list of modules.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{ModuleList}}
     */
    static async getList(options) {
        return conf.global.models.Module.findAll(await ModuleService.getListOptions(options));
    }

    /**
     * Gets a module for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the module type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Module}}
     */
    static async getForName(name, options) {
        const rowList = await ModuleService.getList(deepComplete(options, {where:{name}, limit: 2}));
        return getSingle(rowList, deepComplete(options, {params: ['module', ['name = %s', name], 'Module']}));
    }
    
    /**
     * Gets a module ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the module type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForName(name, options) {
        return (await ModuleService.getForName(name, {...options, attributes: ['id']}))?.id;
    }
}