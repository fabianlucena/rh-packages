const SiteService = require('./site');
const RoleParentSiteService = require('./role_parent_site');
const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const RoleService = {
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
     * Creates a new Role row into DB.
     * @param {{
     *  name: string,
     *  title: string,
     * }} data - data for the new Role.
     *  - name must be unique.
     * @returns {Promise{Role}}
     */
    async create(data) {
        await sqlUtil.checkDataForMissingProperties(data, 'Role', 'name', 'title');
        await RoleService.completeModuleId(data);
        return conf.global.models.Role.create(data);
    },

    /**
     * Creates a new Role row into DB if not exists.
     * @param {data} data - data for the new Role @see RoleService.create.
     * @returns {Promise{Role}}
     */
    createIfNotExists(data, options) {
        return RoleService.getForName(data.name, ru.merge({attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true}, options))
            .then(element => {
                if (element)
                    return element;

                return RoleService.create(data);
            });
    },

    /**
     * Gets a list of roles. If not isEnabled filter provided returns only the enabled roles.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{RoleList}}
     */
    async getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}});
        sqlUtil.completeIncludeOptions(options, 'module', {model: conf.global.models.Module, where: {isEnabled: true}, skipAssociationAttributes: true});
        return conf.global.models.Role.findAll(options);
    },

    /**
     * Gets a role for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Role}}
     */
    async getForName(name, options) {
        const rowList = await RoleService.getList(ru.deepComplete(options, {where:{name: name}, limit: 2}));
        return sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['roles', ['name = %s', name], 'Role']}));
    },
    
    /**
     * Gets a role ID for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getIdForName(name, options) {
        return (await RoleService.getForName(name, ru.merge(options, {attributes: ['id']}))).id;
    },

    /**
     * Gets the direct (first level) roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getForUsernameAndSiteName(username, siteName, options) {
        await sqlUtil.checkDataForMissingProperties({username: username, siteName: siteName}, 'Role', 'username', 'siteName');
        
        options = ru.complete(options, {include: []});
        options.include.push(
            sqlUtil.completeAssociationOptions({model: conf.global.models.User, where: {username: username}}, options),
            sqlUtil.completeAssociationOptions({model: conf.global.models.Site, where: {name:     siteName}}, options),
        );

        return conf.global.models.Role.findAll(options);
    },

    /**
     * Gets the direct (first level) role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getNameForUsernameAndSiteName(username, siteName, options) {
        const roleList = await RoleService.getForUsernameAndSiteName(username, siteName, ru.merge(options, {attributes: ['name'], skipThroughAssociationAttributes: true}));
        return roleList.map(role => role.name);
    },

    /**
     * Gets all of the roles ID for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getAllIdForUsernameAndSiteName(username, siteName, options) {
        const site = await SiteService.getForName(siteName);
        if (!site || !site.isEnabled)
            return;

        const Op = conf.global.Sequelize.Op;
        const parentOptions = ru.merge(
            options,
            {
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
                },
            });
        
        let newRoleList = await RoleService.getForUsernameAndSiteName(username, siteName, {attributes: ['id'], skipThroughAssociationAttributes: true});
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
    },

    /**
     * Gets all of the roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await RoleService.getAllIdForUsernameAndSiteName(username, siteName);
        return RoleService.getList(ru.complete(options, {where:{id:roleIdList}}));
    },

    /**
     * Gets all of the role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getAllNameForUsernameAndSiteName(username, siteName, options) {
        const roleList = await RoleService.getAllForUsernameAndSiteName(username, siteName, ru.merge(options, {attributes: ['name'], skipThroughAssociationAttributes: true}));
        return Promise.all(await roleList.map(role => role.name));
    },
};

module.exports = RoleService;