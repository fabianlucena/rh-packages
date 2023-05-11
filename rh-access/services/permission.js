import {RolePermissionService} from './role_permission.js';
import {conf} from '../conf.js';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties, getSingle, completeAssociationOptions} from 'sql-util';
import {deepComplete, runSequentially} from 'rf-util';

export class PermissionService {
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId && data.ownerModule)
            data.ownerModuleId = await conf.global.services.Module.getIdForName(data.ownerModule);

        return data;
    }

    /**
     * Creates a new Permission row into DB.
     * @param {{name: string, title: string}} data - data for the new Permission.
     *  - name: must be unique.
     * @returns {Promise{Permission}}
     */
    static async create(data) {
        await PermissionService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'Permission', 'name', 'title');

        return conf.global.models.Permission.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {username:    {[Op.like]: q}},
                    {displayName: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }

    /**
     * Gets a list of permission.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionList}}
     */
    static async getList(options) {
        return conf.global.models.Permission.findAll(await PermissionService.getListOptions(options));
    }

    /**
     * Gets a list of permission ant the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.Permission.findAndCountAll(await PermissionService.getListOptions(options));
    }

    /**
     * Gets a permission for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getForName(name, options) {
        const rowList = await PermissionService.getList(deepComplete(options, {where:{name}, limit: 2}));
        return getSingle(rowList, deepComplete(options, {params: ['permission', 'name', name, 'Permission']}));
    }

    /**
     * Creates a new Permission row into DB if not exists.
     * @param {data} data - data for the new Permission @see create.
     * @returns {Promise{Permission}}
     */
    static async createIfNotExists(data, options) {
        let permission = await PermissionService.getForName(data.name, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options});
        if (!permission)
            permission = await PermissionService.create(data);

        if (data.roles) {
            const roles = data.roles instanceof Array?
                data.roles:
                data.roles.split(',');

            await runSequentially(roles, async roleName => await RolePermissionService.createIfNotExists({role: roleName, permission: data.name}));
        }

        return permission;
    }

    /**
     * Gets a permission ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForName(name, options) {
        return (await PermissionService.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Gets a permission list for a given roles names list.
     * @param {Array[string]} rolesName - list of roles name.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getForRolesName(rolesName, options) {
        options = {include: [], ...options};
        options.include.push(completeAssociationOptions({model: conf.global.models.Role, where: {name: rolesName}}, options));

        return PermissionService.getList(options);
    }

    /**
     * Gets a permission name list for a given roles names list.
     * @param {Array[string]} rolesName - list of roles name.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getNamesForRolesName(rolesName, options) {
        const permissionList = await PermissionService.getForRolesName(rolesName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(permissionList.map(permission => permission.name));
    }
}