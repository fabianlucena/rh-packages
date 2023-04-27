import {PermissionTypeService} from './permission_type.js';
import {RoleService} from './role.js';
import {conf} from '../conf.js';
import {MissingPropertyError, checkDataForMissingProperties, completeIncludeOptions, getSingle, completeAssociationOptions} from 'sql-util';
import {deepComplete} from 'rf-util';

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
     * Complete the data object with the typeId property if not exists. 
     * @param {{type: string, typeId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completePermissionTypeId(data) {
        if (data.typeId)
            return data;
            
        if (!data.type)
            throw new MissingPropertyError('Permission', 'type');

        data.typeId = await PermissionTypeService.getIdForName(data.type);
        if (!data.typeId)
            throw new MissingPropertyError('Permission', 'typeId');

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
        await PermissionService.completePermissionTypeId(data);

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
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getForName(name, options) {
        const rowList = await PermissionService.getList(deepComplete(options, {where:{name: name}, limit: 2}));
        return getSingle(rowList, deepComplete(options, {params: ['permission', 'name', name, 'Permission']}));
    }

    /**
     * Creates a new Permission row into DB if not exists.
     * @param {data} data - data for the new Permission @see create.
     * @returns {Promise{Permission}}
     */
    static createIfNotExists(data, options) {
        return PermissionService.getForName(data.name, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return PermissionService.create(data);
            });
    }

    /**
     * Gets a permission ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the permission type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForName(name, options) {
        return (await PermissionService.getForName(name, {...options, attributes: ['id']})).id;
    }

    /**
     * Gets a permission list for a given username and site name.
     * @param {string} username - username for the permission to get.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await RoleService.getAllIdForUsernameAndSiteName(username, siteName);
        options = {include: [], ...options};
        options.include.push(completeAssociationOptions({model: conf.global.models.Role, where: {id: roleIdList}}, options));

        return PermissionService.getList(options);
    }

    /**
     * Gets a permission name list for a given username and site name.
     * @param {string} username - username for the permission to get.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getAllNameForUsernameAndSiteName(username, siteName, options) {
        const permissionList = await PermissionService.getAllForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(permissionList.map(permission => permission.name));
    }

    /**
     * Gets a permission list for a given site name.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getAllForSiteName(siteName, options) {
        options = {include: [], ...options};
        options.include.push(completeAssociationOptions({model: conf.global.models.Site, where: {name: siteName}}, options));

        return PermissionService.getList(options);
    }

    /**
     * Gets a permission name list for a given site name.
     * @param {string} siteName - siteName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getAllNameForSiteName(siteName, options) {
        const permissionList = await PermissionService.getAllForSiteName(siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(permissionList.map(permission => permission.name));
    }

    /**
     * Gets a permission list for a given permission type.
     * @param {string} permissionTypeName - permissionTypeName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getAllForType(permissionTypeName, options) {
        options = {include: [], ...options};
        options.include.push(completeAssociationOptions({model: conf.global.models.PermissionType, where: {name: permissionTypeName}}, options));

        return PermissionService.getList(options);
    }

    /**
     * Gets a permission name list for a given permission type.
     * @param {string} permissionTypeName - permissionTypeName for the permission to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getAllNameForType(permissionTypeName, options) {
        const permissionList = await PermissionService.getAllForType(permissionTypeName, {...options, attributes: ['name'], skipAssociationAttributes: true});
        return Promise.all(permissionList.map(permission => permission.name));
    }
}