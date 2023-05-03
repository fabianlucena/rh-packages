import {UserGroupService} from './user_group.js';
import {conf} from '../conf.js';
import {checkDataForMissingProperties, completeIncludeOptions, getSingle, completeAssociationOptions} from 'sql-util';
import {complete, deepComplete} from 'rf-util';

export class GroupService {
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
     * Creates a new Group row into DB.
     * @param {{
     *  username: string,
     *  title: string,
     * }} data - data for the new Group.
     *  - username must be unique.
     * @returns {Promise{Group}}
     */
    static async create(data) {
        await checkDataForMissingProperties(data, 'Group', 'username', 'displayName');
        await GroupService.completeOwnerModuleId(data);
        return conf.global.models.User.create(data);
    }

    /**
     * Creates a new Group row into DB if not exists.
     * @param {data} data - data for the new Group @see create.
     * @returns {Promise{Group}}
     */
    static createIfNotExists(data, options) {
        return GroupService.getForUsername(data.username, {attributes: ['id'], foreign:{module:{attributes:[]}}, skipNoRowsError: true, ...options})
            .then(element => {
                if (element)
                    return element;

                return GroupService.create(data);
            });
    }

    /**
     * Gets a list of groups. If not isEnabled filter provided returns only the enabled groups.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{GroupList}}
     */
    static async getList(options) {
        options = deepComplete(options, {where: {isEnabled: true}});
        completeIncludeOptions(options, 'module', {model: conf.global.models.Module, where: {isEnabled: true}, skipAssociationAttributes: true});
        return conf.global.models.User.findAll(options);
    }

    /**
     * Gets a group for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the group to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Group}}
     */
    static async getForUsername(username, options) {
        const rowList = await GroupService.getList(deepComplete(options, {where:{username}, limit: 2}));
        return getSingle(rowList, deepComplete(options, {params: ['groups', ['username = %s', username], 'Group']}));
    }

    /**
     * Gets a group ID for its username. For many coincidences and for no rows this method fails.
     * @param {string} username - username for the group to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Permission}}
     */
    static async getIdForUsername(username, options) {
        return (await GroupService.getForUsername(username, {...options, attributes: ['id']})).id;
    }

    /**
     * Gets the direct (first level) groups for a given group username.
     * @param {string} username - username for the group to retrive its parent groups.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{GroupList}}
     */
    static async getParentsForUsername(username, options) {
        await checkDataForMissingProperties({username}, 'Group', 'username');
        
        options = complete(options, {include: []});
        options.include = [
            /*{
                model: conf.global.models.User,
                as: 'User',
                attributes: [],
                /*include: [
                    {
                        model: conf.global.models.Module,
                        attributes: [],
                        where: {
                            isEnabled: true,
                        }
                    }
                ], * /
                where: {username},
            }, */
            {
                model: conf.global.models.User,
                as: 'Group',
                attributes: [],
                /*include: [
                    {
                        model: conf.global.models.Module,
                        attributes: [],
                        where: {
                            isEnabled: true,
                        }
                    }
                ],*/
                where: {isEnabled: true},
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

        /*options.include.push(
            completeAssociationOptions({
                model: conf.global.models.User,
                as: 'Group'
            }, options),
        );*/

        return conf.global.models.UserGroup.findAll(options);
    }

    /**
     * Gets the direct (first level) group usernames for a given group username.
     * @param {string} username - username for the group to retrive its parents group usernames.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getParentsNameForUsername(username, options) {
        const rowList = await GroupService.getParentsForUsername(username, {...options, attributes: ['username'], skipThroughAssociationAttributes: true});
        return rowList.map(row => row.username);
    }

    /**
     * Gets all of the groups ID for a given group username and.
     * @param {string} username - username for the group to retrive its parents group ID.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{GroupList}}
     */
    static async getAllIdsForUsername(username, options) {
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
                            attributes: [],
                            where: {
                                isEnabled: true,
                            }
                        }
                    ],
                    where: {},
                },
                {
                    model: conf.global.models.User,
                    as: 'Group',
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
            ]
        };
        
        let newGroupList = await GroupService.getParentsForUsername(username, {attributes: ['groupId'], skipAssociationAttributes: true});
        let allGroupIdList = await newGroupList.map(group => group.id);
        let newGroupIdList = allGroupIdList;
            
        while(newGroupList.length) {
            parentOptions.where.userId = {[Op.in]: newGroupIdList};
            parentOptions.where.groupId = {[Op.notIn]: allGroupIdList};

            newGroupList = await UserGroupService.getList(parentOptions);
            if (!newGroupList.length)
                break;

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
    static async getAllForUsername(username, options) {
        const groupIdList = await GroupService.getAllIdsForUsername(username);
        return GroupService.getList(complete(options, {where:{id:groupIdList}}));
    }

    /**
     * Gets all of the group names for a given username and site name.
     * @param {string} username - username for the user to retrive its groups.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{[]string}}
     */
    static async getAllNamesForUsername(username, options) {
        if (!username)
            return [];
            
        const groupsList = await GroupService.getAllForUsername(username, {...options, attributes: ['username'], skipThroughAssociationAttributes: true});
        return Promise.all(await groupsList.map(group => group.username));
    }
}