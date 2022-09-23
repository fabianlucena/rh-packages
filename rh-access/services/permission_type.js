const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const PermissionTypeService = {
    /**
     * Creates a new PermissionType row into DB.
     * @param {{name: string, title: string} data - data for the new PermissionType.
     *  - name: must be unique.
     * @returns {Promise{PermissionType}}
     */
    async create(data) {
        if (!data.name)
            throw new sqlUtil.MissingPropertyError('Permission', 'name');

        if (!data.title)
            throw new sqlUtil.MissingPropertyError('Permission', 'title');

        return conf.global.models.PermissionType.create(data);
    },

    /**
     * Gets a list of permission types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionTypeList}]
     */
    async getList(options) {
        return conf.global.models.PermissionType.findAll(ru.complete(options, {}));
    },

    /**
     * Gets a permission type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{PermissionType}}
     */
    getForName(name, options) {
        return PermissionTypeService.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['permission type', 'name', name, 'PermissionType']})));
    },

    /**
     * Gets a permission type ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{PermissionType}}
     */
    async getIdForName(name, options) {
        return (await PermissionTypeService.getForName(name, ru.merge(options, {attributes: ['id']}))).id;
    },
};

module.exports = PermissionTypeService;