import {UserGroupService} from './user_group.js';
import {conf} from '../conf.js';
import {ServiceIdUuidEnabledModule} from 'rf-service';
import {checkDataForMissingProperties, completeAssociationOptions, getSingle} from 'sql-util';

export class GroupService extends ServiceIdUuidEnabledModule {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
    model = conf.global.models.User;
    moduleModel = conf.global.models.Module;
    references = {
        type: conf.global.services.UserType.singleton(),
    };
    defaultTranslationContext = 'group';
    searchColumns = ['username', 'displayName'];

    async validateForCreation(data) {
        data ??= {};
        if (!data.typeId && !data.type) {
            data.type = 'group';
        }

        return super.validateForCreation(data);
    }

    /**
     * Creates a new Groups row into DB if not exists.
     * @param {data} data - data for the new Role @see create.
     * @returns {Promise{Role}}
     */
    async createIfNotExists(data, options) {
        const row = await this.getForUsername(data.username, {attributes: ['id'], foreign: {module: {attributes:[]}}, skipNoRowsError: true, ...options});
        if (row) {
            return row;
        }

        return this.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {object} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {object}
     */
    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'username', 'displayName'];
            }
        }

        options.include ??= [];

        if (options.includeType) {
            options.include.push({ 
                model: conf.global.models.UserType, 
                attributes: ['uuid', 'name', 'title']
            });
        }

        return super.getListOptions(options);
    }

    /**
     * Gets a group for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the group to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Group}}
     */
    async getForUsername(username, options) {
        options = {...options, where: {...options?.where, username}};

        if (Array.isArray(username)) {
            return this.getList(options);
        }

        options.limit ??= 2;
        const rows = await this.getList(options);

        return getSingle(rows, {params: ['groups', ['username = %s', username], 'Group'], ...options});
    }

    /**
     * Gets a group ID for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the group to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    async getIdForUsername(username, options) {
        return (await this.getForUsername(username, {...options, attributes: ['id']})).id;
    }

    /**
     * Gets the direct (first level) groups for a given group username.
     * @param {string} username - username for the group to retrive its parent groups.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{GroupList}}
     */
    async getParentsForUsername(username, options) {
        await checkDataForMissingProperties({username}, 'Group', 'username');
        
        const isEnabled = options?.isEnabled ?? true;
        const Op = conf.global.Sequelize.Op;
        options = {...options, include: []};
        options.include = [
            {
                model: conf.global.models.User,
                as: 'Group',
                attributes: [],
                include: [
                    {
                        model: conf.global.models.Module,
                        as: 'OwnerModule',
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
        ];

        options.include.push(
            completeAssociationOptions({
                model: conf.global.models.User,
                as: 'User',
                attributes: [],
                where: {username}
            }, options),
        );

        return conf.global.models.UserGroup.findAll(options);
    }

    /**
     * Gets the direct (first level) group usernames for a given group username.
     * @param {string} username - username for the group to retrive its parents group usernames.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getParentsNameForUsername(username, options) {
        const rowList = await this.getParentsForUsername(username, {...options, attributes: ['username'], skipThroughAssociationAttributes: true});
        return rowList.map(row => row.username);
    }

    /**
     * Gets all of the groups ID for a given group username and.
     * @param {string} username - username for the group to retrive its parents group ID.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{GroupList}}
     */
    async getAllIdsForUsername(username, options) {
        const isEnabled = options?.isEnabled ?? true;
        const Op = conf.global.Sequelize.Op;
        const parentOptions = {
            ...options,
            attributes: ['groupId'],
            include: [
                {
                    model: conf.global.models.User,
                    as: 'User',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
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
                    model: conf.global.models.User,
                    as: 'Group',
                    attributes: [],
                    include: [
                        {
                            model: conf.global.models.Module,
                            as: 'OwnerModule',
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
            ]
        };
        
        let newGroupList = await this.getParentsForUsername(username, {attributes: ['groupId'], skipAssociationAttributes: true});
        let allGroupIdList = await newGroupList.map(group => group.id);
        let newGroupIdList = allGroupIdList;
        
        const userGroupService = UserGroupService.singleton();
        while(newGroupList.length) {
            parentOptions.where.userId = {[Op.in]: newGroupIdList};
            parentOptions.where.groupId = {[Op.notIn]: allGroupIdList};

            newGroupList = await userGroupService.getList(parentOptions);
            if (!newGroupList?.length) {
                break;
            }

            newGroupIdList = await newGroupList.map(group => group.groupId);
            allGroupIdList = [...allGroupIdList, ...newGroupIdList];
        }

        return allGroupIdList;
    }

    /**
     * Gets all of the groups for a given username.
     * @param {string} username - username for the user to retrive its groupss.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{GroupList}}
     */
    async getAllForUsername(username, options) {
        const groupIdList = await this.getAllIdsForUsername(username);
        return this.getList({...options, where: {...options?.where, id: groupIdList}});
    }

    /**
     * Gets all of the group names for a given username and site name.
     * @param {string} username - username for the user to retrive its groups.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    async getAllNamesForUsername(username, options) {
        if (!username) {
            return [];
        }
            
        const groupsList = await this.getAllForUsername(username, {...options, attributes: ['username'], skipThroughAssociationAttributes: true});
        return Promise.all(await groupsList.map(group => group.username));
    }
}