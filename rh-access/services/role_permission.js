import {RoleService} from './role.js';
import {PermissionService} from './permission.js';
import {conf} from '../conf.js';
import {addEnabledOnerModuleFilter, MissingPropertyError, checkDataForMissingProperties, skipAssociationAttributes} from 'sql-util';
import {complete} from 'rf-util';

export class RolePermissionService {
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer}} data 
     * @returns {Promise{data}}
     */
    static async completeRoleId(data) {
        if (!data.roleId && data.role)
            data.roleId = await RoleService.singleton().getIdForName(data.role);

        return data;
    }

    /**
     * Complete the data object with the permissionId property if not exists. 
     * @param {{permission: string, permissionId: integer}} data 
     * @returns {Promise{data}}
     */
    static async completePermissionId(data) {
        if (!data.permissionId && data.permission)
            data.permissionId = await PermissionService.getIdForName(data.permission);

        return data;
    }

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
    static async create(data) {
        await RolePermissionService.completeRoleId(data);
        await RolePermissionService.completePermissionId(data);

        await checkDataForMissingProperties(data, 'Permission', 'roleId', 'permissionId');

        return conf.global.models.RolePermission.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);

        return options;
    }

    /**
     * Gets a list of poermissions per role.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RolePermissionList}}
     */
    static async getList(options) {
        return conf.global.models.RolePermission.findAll(await RolePermissionService.getListOptions(options));
    }

    /**
     * Creates a new RolePermission row into DB if not exists.
     * @param {data} data - data for the new RolePermission.
     * @returns {Promise{Permission}}
     */
    static async createIfNotExists(data, options) {
        options = {...options, attributes: ['roleId', 'permissionId'], where: {}, include: [], limit: 1};

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(complete({model: conf.global.models.Role, where: {name: data.role}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('RolePermission', 'role', 'roleId');
        
        if (data.permissionId)
            options.where.permissionId = data.permissionId;
        else if (data.permission)
            options.include.push(complete({model: conf.global.models.Permission, where: {name: data.permission}}, skipAssociationAttributes));
        else
            throw new MissingPropertyError('RolePermission', 'permission', 'permissionId');

        const rowList = await RolePermissionService.getList(options);
        if (rowList.length)
            return rowList[0];

        return RolePermissionService.create(data);
    }
}