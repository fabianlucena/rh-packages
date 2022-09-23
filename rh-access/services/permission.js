const PermissionTypeService = require('./permission_type');
const RoleService = require('./role');
const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const PermissionService = {
    /**
     * Complete the data object with the moduleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeModuleId(data) {
        if (!data.moduleId)
            if (!data.module)
                throw new sqlUtil.MissingPropertyError('Module', 'module', 'moduleId');
            else
                data.moduleId = await conf.global.services.module.getIdForName(data.module);

        return data;
    },

    /**
     * Complete the data object with the typeId property if not exists. 
     * @param {{type: string, typeId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completePermissionTypeId(data) {
        if (data.typeId)
            return data;
            
        if (!data.type)
            throw new sqlUtil.MissingPropertyError('Permission', 'type');

        data.typeId = await PermissionTypeService.getIdForName(data.type);
        if (!data.typeId)
            throw new sqlUtil.MissingPropertyError('Permission', 'typeId');

        return data;
    },

    /**
     * Creates a new Permission row into DB.
     * @param {{name: string, title: string}} data - data for the new Permission.
     *  - name: must be unique.
     * @returns {Promise{Permission}}
     */
    async create(data) {
        await sqlUtil.checkDataForMissingProperties(data, 'Permission', 'name', 'title')
        
        await PermissionService.completeModuleId(data);
        await PermissionService.completePermissionTypeId(data);

        return conf.global.models.Permission.create(data);
    },

    /**
     * Gets a list of permission. If not isEnabled filter provided returns only the enabled permissions.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionList}}
     */
    async getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}, include: []});
        sqlUtil.completeIncludeOptions(options, 'module', {model: conf.global.models.Module, attributes: [], where: {isEnabled: true}});
        return conf.global.models.Permission.findAll(options);
    },

    /**
     * Gets a permission for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getForName(name, options) {
        const rowList = await PermissionService.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}));
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['permission', 'name', name, 'Permission']}));
    },

    /**
     * Creates a new Permission row into DB if not exists.
     * @param {data} data - data for the new Permission @see PermissionService.create.
     * @returns {Promise{Permission}}
     */
    createIfNotExists(data, options) {
        return PermissionService.getForName(data.name, ru.merge({attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true}, options))
            .then(element => {
                if (element)
                    return element;

                return PermissionService.create(data);
            });
    },

    /**
     * Gets a permission ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getIdForName(name, options) {
        return (await PermissionService.getForName(name, ru.merge(options, {attributes: ['id']}))).id;
    },

    /**
     * Gets a permission list for a given username and site name.
     * @param {string} username - username for the permission to get.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await RoleService.getAllIdForUsernameAndSiteName(username, siteName);
        options = ru.complete(options, {include: []});
        options.include.push(sqlUtil.completeAssociationOptions({model: conf.global.models.Role, where: {id: roleIdList}}, options));

        return PermissionService.getList(options);
    },

    /**
     * Gets a permission name list for a given username and site name.
     * @param {string} username - username for the permission to get.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getAllNameForUsernameAndSiteName(username, siteName, options) {
        const permissionList = await PermissionService.getAllForUsernameAndSiteName(username, siteName, ru.merge(options, {attributes: ['name'], skipThroughAssociationAttributes: true}));
        return Promise.all(permissionList.map(permission => permission.name));
    },
};

module.exports = PermissionService;