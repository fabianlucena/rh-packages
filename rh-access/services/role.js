import {SiteService} from './site.js';
import {RoleParentSiteService} from './role_parent_site.js';
import {conf} from '../conf.js';
import {MissingPropertyError, checkDataForMissingProperties, completeIncludeOptions, getSingle, completeAssociationOptions} from 'sql-util';
import {complete, deepComplete} from 'rofa-util';

/**
 * Complete the data object with the moduleId property if not exists. 
 * @param {{module: string, moduleId: integer, ...}} data 
 * @returns {Promise{data}}
 */
export async function completeModuleId(data) {
    if (!data.moduleId)
        if (!data.module)
            throw new MissingPropertyError('Module', 'module', 'moduleId');
        else
            data.moduleId = await conf.global.services.module.getIdForName(data.module);

    return data;
}

/**
 * Creates a new Role row into DB.
 * @param {{
 *  name: string,
 *  title: string,
 * }} data - data for the new Role.
 *  - name must be unique.
 * @returns {Promise{Role}}
 */
export async function create(data) {
    await checkDataForMissingProperties(data, 'Role', 'name', 'title');
    await completeModuleId(data);
    return conf.global.models.Role.create(data);
}

/**
 * Creates a new Role row into DB if not exists.
 * @param {data} data - data for the new Role @see create.
 * @returns {Promise{Role}}
 */
export function createIfNotExists(data, options) {
    return getForName(data.name, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options})
        .then(element => {
            if (element)
                return element;

            return create(data);
        });
}

/**
 * Gets a list of roles. If not isEnabled filter provided returns only the enabled roles.
 * @param {Opions} options - options for the @ref sequelize.findAll method.
 * @returns {Promise{RoleList}}
 */
export async function getList(options) {
    options = deepComplete(options, {where: {isEnabled: true}});
    completeIncludeOptions(options, 'module', {model: conf.global.models.Module, where: {isEnabled: true}, skipAssociationAttributes: true});
    return conf.global.models.Role.findAll(options);
}

/**
 * Gets a role for its name. For many coincidences and for no rows this method fails.
 * @param {string} name - name for the role type to get.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{Role}}
 */
export async function getForName(name, options) {
    const rowList = await getList(deepComplete(options, {where:{name: name}, limit: 2}));
    return getSingle(rowList, deepComplete(options, {params: ['roles', ['name = %s', name], 'Role']}));
}

/**
 * Gets a role ID for its name. For many coincidences and for no rows this method fails.
 * @param {string} name - name for the role type to get.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{Permission}}
 */
export async function getIdForName(name, options) {
    return (await getForName(name, {...options, attributes: ['id']})).id;
}

/**
 * Gets the direct (first level) roles for a given username and site name.
 * @param {string} username - username for the user to retrive its roles.
 * @param {string} siteName - siteName in wich the user has the roles.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{RoleList}}
 */
export async function getForUsernameAndSiteName(username, siteName, options) {
    await checkDataForMissingProperties({username: username, siteName: siteName}, 'Role', 'username', 'siteName');
    
    options = complete(options, {include: []});
    options.include.push(
        completeAssociationOptions({model: conf.global.models.User, where: {username: username}}, options),
        completeAssociationOptions({model: conf.global.models.Site, where: {name:     siteName}}, options),
    );

    return conf.global.models.Role.findAll(options);
}

/**
 * Gets the direct (first level) role names for a given username and site name.
 * @param {string} username - username for the user to retrive its roles.
 * @param {string} siteName - siteName in wich the user has the roles.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{[]string}}
 */
export async function getNameForUsernameAndSiteName(username, siteName, options) {
    const roleList = await getForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
    return roleList.map(role => role.name);
}

/**
 * Gets all of the roles ID for a given username and site name.
 * @param {string} username - username for the user to retrive its roles.
 * @param {string} siteName - siteName in wich the user has the roles.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{RoleList}}
 */
export async function getAllIdForUsernameAndSiteName(username, siteName, options) {
    const site = await SiteService.getForName(siteName);
    if (!site || !site.isEnabled)
        return;

    const Op = conf.global.Sequelize.Op;
    const parentOptions = {
        ...options,
        attributes: ['parentId'],
        include: [
            {
                model: conf.global.models.Role,
                as: 'Role',
                attributes: [],
                include: [
                    {
                        model: conf.global.models.Module,
                        attributes: [],
                        where: {
                            isEnabled: true,
                        }
                    }
                ],
                where: {},
            },
            {
                model: conf.global.models.Role,
                as: 'Parent',
                attributes: [],
                include: [
                    {
                        model: conf.global.models.Module,
                        attributes: [],
                        where: {
                            isEnabled: true,
                        }
                    }
                ],
                where: {},
            },
        ],
        where: {
            siteId: site.id,
        }
    };
    
    let newRoleList = await getForUsernameAndSiteName(username, siteName, {attributes: ['id'], skipThroughAssociationAttributes: true});
    let allRoleIdList = await newRoleList.map(role => role.id);
    let newRoleIdList = allRoleIdList;
        
    while(newRoleList.length)
    {
        parentOptions.where.roleId = {[Op.in]: newRoleIdList};
        parentOptions.where.parentId = {[Op.notIn]: allRoleIdList};

        newRoleList = await RoleParentSiteService.getList(parentOptions);
        if (!newRoleList.length)
            break;

        newRoleIdList = await newRoleList.map(roleParent => roleParent.parentId);
        allRoleIdList = allRoleIdList.concat(newRoleIdList);
    }

    return allRoleIdList;
}

/**
 * Gets all of the roles for a given username and site name.
 * @param {string} username - username for the user to retrive its roles.
 * @param {string} siteName - siteName in wich the user has the roles.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{RoleList}}
 */
export async function getAllForUsernameAndSiteName(username, siteName, options) {
    const roleIdList = await getAllIdForUsernameAndSiteName(username, siteName);
    return getList(complete(options, {where:{id:roleIdList}}));
}

/**
 * Gets all of the role names for a given username and site name.
 * @param {string} username - username for the user to retrive its roles.
 * @param {string} siteName - siteName in wich the user has the roles.
 * @param {Options} options - Options for the @ref getList method.
 * @returns {Promise{[]string}}
 */
export async function getAllNameForUsernameAndSiteName(username, siteName, options) {
    const roleList = await getAllForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
    return Promise.all(await roleList.map(role => role.name));
}
