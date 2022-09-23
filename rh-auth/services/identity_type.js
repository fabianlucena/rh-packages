const conf = require('../index');
const sqlUtil = require('sql-util');

const IdentityTypeService = {
    /**
     * Creates a new IdentityType row into DB.
     * @param {{name: string, title: {string}} data - data for the new IdentityType.
     *  - name: must be unique.
     * @returns {Promise{IdentityType}}
     */
    async create(data) {
        if (!data.name)
            throw new sqlUtil.MissingPropertyError('IdentityType', 'name');

        if (!data.title)
            throw new sqlUtil.MissingPropertyError('IdentityType', 'title');

        return conf.global.models.IdentityType.create(data);
    },

    /**
     * Gets a list of identities types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{IdentityTypeList}]
     */
    getList(options) {
        return conf.global.models.IdentityType.findAll(ru.complete(options, {}));
    },

    /**
     * Gets a identity type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the identity type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{IdentityType}}
     */
    getForName(name, options) {
        return this.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['identity type', 'name', name, 'IdentityType']})));
    },
};

module.exports = IdentityTypeService;