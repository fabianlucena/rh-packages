import {RoleParentSiteService} from './role_parent_site.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnabledModuleTranslatable} from 'rf-service';
import {checkDataForMissingProperties, completeAssociationOptions} from 'sql-util';

export class RoleService extends ServiceIdUuidNameTitleEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
    model = conf.global.models.Role;
    moduleModel = conf.global.models.Module;
    moduleService = conf.global.services.Module.singleton();
    defaultTranslationContext = 'role';

    constructor() {
        if (!conf?.global?.services?.Module?.singleton) {
            throw new Error('There is no Module service. Try adding RH Module module to the project.');
        }

        super();

        this.siteService = conf.global.services.Site.singleton();
    }

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Role', 'name', 'title');
        return super.validateForCreation(data);
    }

    /**
     * Gets the direct (first level) roles for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getForUsernameAndSiteName(username, siteName, options) {
        await checkDataForMissingProperties({username, siteName}, 'Role', 'username', 'siteName');
        
        options ??= {};
        options.include ??= [];
        options.include.push(
            completeAssociationOptions({model: conf.global.models.User, where: {username}}, options),
            completeAssociationOptions({model: conf.global.models.Site, where: {name: siteName}}, options),
        );

        return this.model.findAll(options);
    }

    /**
     * Gets the direct (first level) role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getNameForUsernameAndSiteName(username, siteName, options) {
        const roleList = await this.getForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return roleList.map(role => role.name);
    }

    /**
     * Gets all of the roles ID for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{RoleList}}
     */
    async getAllIdsForUsernameAndSiteName(username, siteName, options) {
        const site = await this.siteService.getForName(siteName, {isEnabled: true});
        if (!site || (Array.isArray(site) && !site.length)) {
            return;
        }

        const siteId = Array.isArray(site)?
            site.map(site => site.id):
            site.id;

        const isEnabled = options?.isEnabled ?? true;
        const Op = conf.global.Sequelize.Op;
        const parentOptions = {
            ...options,
            attributes: ['parentId'],
            include: [
                {
                    model: this.model,
                    as: 'Role',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
                            required: false,
                            attributes: [],
                            where: {
                                [Op.or]: [
                                    {id: {[Op.eq]: null}},
                                    {isEnabled: {[Op.eq]: isEnabled}},
                                ],
                            },
                        }
                    ],
                    where: {isEnabled},
                },
                {
                    model: this.model,
                    as: 'Parent',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
                            required: false,
                            attributes: [],
                            where: {
                                [Op.or]: [
                                    {id: {[Op.eq]: null}},
                                    {isEnabled: {[Op.eq]: isEnabled}},
                                ],
                            },
                        }
                    ],
                    where: {isEnabled},
                },
            ],
            where: {siteId}
        };
        
        let newRoleList = await this.getForUsernameAndSiteName(username, siteName, {attributes: ['id'], skipThroughAssociationAttributes: true});
        let allRoleIdList = await newRoleList.map(role => role.id);
        let newRoleIdList = allRoleIdList;
        
        const roleParentSiteService = RoleParentSiteService.singleton();
        while(newRoleList.length) {
            parentOptions.where.roleId = {[Op.in]: newRoleIdList};
            parentOptions.where.parentId = {[Op.notIn]: allRoleIdList};

            newRoleList = await roleParentSiteService.getList(parentOptions);
            if (!newRoleList.length) {
                break;
            }

            newRoleIdList = await newRoleList.map(roleParent => roleParent.parentId);
            allRoleIdList = [...allRoleIdList, ...newRoleIdList];
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
    async getAllForUsernameAndSiteName(username, siteName, options) {
        const roleIdList = await this.getAllIdsForUsernameAndSiteName(username, siteName, options);
        return this.getList({...options, where: {id:roleIdList ?? null, ...options?.where, }});
    }

    /**
     * Gets all of the role names for a given username and site name.
     * @param {string} username - username for the user to retrive its roles.
     * @param {string} siteName - siteName in wich the user has the roles.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getAllNamesForUsernameAndSiteName(username, siteName, options) {
        const roleList = await this.getAllForUsernameAndSiteName(username, siteName, {...options, attributes: ['name'], skipThroughAssociationAttributes: true});
        return Promise.all(await roleList.map(role => role.name));
    }
}