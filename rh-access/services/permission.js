import {RolePermissionService} from './role_permission.js';
import {conf} from '../conf.js';
import {MissingPropertyError, checkDataForMissingProperties, completeIncludeOptions, getSingle, completeAssociationOptions} from 'sql-util';
import {deepComplete, runSequentially} from 'rf-util';

export class PermissionService {
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId)
            if (!data.ownerModule)
                throw new MissingPropertyError('Permission', 'module', 'moduleId');
            else
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
        await checkDataForMissingProperties(data, 'Permission', 'name', 'title');
        
        await PermissionService.completeOwnerModuleId(data);

        return conf.global.models.Permission.create(data);
    }

    /**
     * Gets a list of permission. If not isEnabled filter provided returns only the enabled permissions.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{PermissionList}}
     */
    static async getList(options) {
        options = deepComplete(options, {where: {isEnabled: true}, include: []});
        completeIncludeOptions(options, 'module', {model: conf.global.models.Module, attributes: [], where: {isEnabled: true}});
        return conf.global.models.Permission.findAll(options);
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
    static createIfNotExists(data, options) {
        return PermissionService.getForName(data.name, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options})
            .then(async permission => {
                if (!permission)
                    permission = await PermissionService.create(data);

                if (data.roles) {
                    const roles = data.roles instanceof Array?
                        data.roles:
                        data.roles.split(',');
        
                    await runSequentially(roles, async roleName => await RolePermissionService.createIfNotExists({role: roleName, permission: data.name}));
                }
            });
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