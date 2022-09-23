const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const ModuleService = {
    /**
     * Creates a new Module row into DB.
     * @param {{
     *  name: string,
     *  title: string,
     * }} data - data for the new Module.
     *  - name must be unique.
     * @returns {Promise{Module}}
     */
    async create(data) {
        await sqlUtil.checkDataForMissingProperties(data, 'Module', 'name', 'title')
        return conf.global.models.Module.create(data);
    },

    /**
     * Creates a new Module row into DB if not exists.
     * @param {data} data - data for the new Module @see ModuleService.create.
     * @returns {Promise{Module}}
     */
     async createIfNotExists(data, options) {
        const element = await ModuleService.getForName(data.name, ru.merge({attributes: ['id'], skipNoRowsError: true}, options));
        if (element)
            return element;

        return ModuleService.create(data);
    },

    /**
     * Gets a list of modules. If not isEnabled filter provided returns only the enabled modules.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{ModuleList}}
     */
    async getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}});
        return conf.global.models.Module.findAll(options);
    },

    /**
     * Gets a module for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the module type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Module}}
     */
    async getForName(name, options) {
        const rowList = await ModuleService.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}));
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['module', ['name = %s', name], 'Module']}));
    },
    
    /**
     * Gets a module ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the module type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getIdForName(name, options) {
        return (await ModuleService.getForName(name, ru.merge(options, {attributes: ['id']}))).id;
    },
};

module.exports = ModuleService;