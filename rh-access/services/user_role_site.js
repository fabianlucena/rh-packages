const RoleService = require('./role');
const SiteService = require('./site');
const conf = require('../index');
const ru = require('rofa-util');
const sqlUtil = require('sql-util');

const UserRoleSiteService = {
    /**
     * Complete the data object with the userId property if not exists. 
     * @param {{username: string, userId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeUserId(data) {
        if (!data.userId)
            if (!data.username)
                throw new sqlUtil.MissingPropertyError('UserRoleSite', 'username', 'userId');
            else
                data.userId = await conf.global.services.user.getIdForUsername(data.username);

        return data;
    },
    
    /**
     * Complete the data object with the roleId property if not exists. 
     * @param {{role: string, roleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeRoleId(data) {
        if (!data.roleId)
            if (!data.role)
                throw new sqlUtil.MissingPropertyError('UserRoleSite', 'role', 'roleId');
            else
                data.roleId = await RoleService.getIdForName(data.role);

        return data;
    },

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeSiteId(data) {
        if (!data.siteId)
            if (!data.site)
                throw new sqlUtil.MissingPropertyError('UserRoleSite', 'site', 'siteId');
            else
                data.siteId = await SiteService.getIdForName(data.site, {foreign:{module: false}});

        return data;
    },

    /**
     * Complete the data object with the userId, roleId, and siteId properties if not exists. 
     * @param {{username: string, userId, role: string, roleId: integer, site: string, siteId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeUserIdRoleIdSiteId(data) {
        await UserRoleSiteService.completeUserId(data);
        await UserRoleSiteService.completeRoleId(data);
        await UserRoleSiteService.completeSiteId(data);
    },
    
    /**
     * Creates a new UserRoleSite row into DB. Assign user roles in a site. 
     * @param {{userId: integer, roleId: integer, siteId: integer} data - data for the new UserRoleSite.
     * @returns {Promise{UserRoleSite}}
     */
    async create(data) {
        await UserRoleSiteService.completeUserIdRoleIdSiteId(data);
        return conf.global.models.UserRoleSite.create(data);
    },

    /**
     * Gets a list of UserRoleSite.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    async getList(options) {
        return conf.global.models.UserRoleSite.findAll(options);
    },

    /**
     * Creates a new UserRoleSite row into DB if not exists.
     * @param {data} data - data for the new UserRoleSite.
     * @returns {Promise{UserRoleSite}}
     */
    async createIfNotExists(data, options) {
        options = ru.merge(options, {attributes: ['userId', 'roleId', 'siteId'], where: {}, include: [], limit: 1});

        if (data.userId)
            options.where.userId = data.userId;
        else if (data.username)
            options.include.push(ru.complete({model: conf.global.models.User, where: {username: data.username}}, sqlUtil.skipAssociationAttributes));
        else
            throw new sqlUtil.MissingPropertyError('UserRoleSite', 'user', 'userId');

        if (data.roleId)
            options.where.roleId = data.roleId;
        else if (data.role)
            options.include.push(ru.complete({model: conf.global.models.Role, where: {name: data.role}}, sqlUtil.skipAssociationAttributes));
        else
            throw new sqlUtil.MissingPropertyError('UserRoleSite', 'role', 'roleId');
        
        if (data.siteId)
            options.where.siteId = data.siteId;
        else if (data.site)
            options.include.push(ru.complete({model: conf.global.models.Site, where: {name: data.site}}, sqlUtil.skipAssociationAttributes));
        else
            throw new sqlUtil.MissingPropertyError('UserRoleSite', 'site', 'siteId');

        const rowList = await UserRoleSiteService.getList(options);
        if (rowList.length)
            return rowList[0];

        return UserRoleSiteService.create(data);
    },
};

module.exports = UserRoleSiteService;