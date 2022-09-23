const RoleService = require('../services/role');
const PermissionService = require('../services/permission');
const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const RolePermissionService = {
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer}} data 
     * @returns {Promise{data}}
     */
    async completeRoleId(data) {
        if (!data.roleId)
            if (!data.role)
                throw new sqlUtil.MissingPropertyError('RolePermission', 'role', 'roleId');
            else
                data.roleId = await RoleService.getIdForName(data.role);

        return data;
    },

    /**
     * Complete the data object with the permissionId property if not exists. 
     * @param {{permission: string, permissionId: integer}} data 
     * @returns {Promise{data}}
     */
    async completePermissionId(data) {
        if (!data.permissionId)
            if (!data.permission)
                throw new sqlUtil.MissingPropertyError('RolePermission', 'permission', 'permissionId');
            else
                data.permissionId = await PermissionService.getIdForName(data.permission);

        return data;
    },

    /**
     * Creates a new RolePermission row into DB.
     * @param {{
     *  role: string,
     *  permission: string,
     *  roleId: integer,
     *  permissionId: integer,
     * }} data - data for the new RolePermission.
     * @returns {Promise{Permission}}
     */
    async create(data) {
        await RolePermissionService.completeRoleId(data);
        await RolePermissionService.completePermissionId(data);

        return conf.global.models.RolePermission.create(data);
    },

    /**
     * Gets a list of poermissions per role.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RolePermissionList}}
     */
    async getList(options) {
        return conf.global.models.RolePermission.findAll(options);
    },

    /**
     * Creates a new RolePermission row into DB if not exists.
     * @param {data} data - data for the new RolePermission.
     * @returns {Promise{Permission}}
     */
    async createIfNotExists(data, options) {
        options = ru.merge(options, {attributes: ['roleId', 'permissionId'], where: {}, include: [], limit: 1});

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(ru.complete({model: conf.global.models.Role, where: {name: data.role}}, sqlUtil.skipAssociationAttributes));
        else
            throw new sqlUtil.MissingPropertyError('RolePermission', 'role', 'roleId');
        
        if (data.permissionId)
            options.where.permissionId = data.permissionId;
        else if (data.permission)
            options.include.push(ru.complete({model: conf.global.models.Permission, where: {name: data.permission}}, sqlUtil.skipAssociationAttributes));
        else
            throw new sqlUtil.MissingPropertyError('RolePermission', 'permission', 'permissionId');

        const rowList = await RolePermissionService.getList(options);
        if (rowList.length)
            return rowList[0];

        return RolePermissionService.create(data);
    },
};

module.exports = RolePermissionService;