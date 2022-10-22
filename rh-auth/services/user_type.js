const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const UserTypeService = {
    /**
     * Creates a new user type row into DB.
     * @param {{name: string, title: string} data - data for the new UserType.
     *  - name: must be unique.
     * @returns {Promise{UserType}}
     */
    create(data) {
        return conf.global.models.UserType.create(data);
    },

    /**
     * Gets a list of users types.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{UserTypeList}]
     */
    getList(options) {
        return conf.global.models.UserType.findAll(ru.complete(options, {}));
    },

    /**
     * Gets an user type for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the user type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{UserType}}
     */
    getForName(name, options) {
        return this.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['user type', 'name', name, 'UserType']})));
    },
};

module.exports = UserTypeService;