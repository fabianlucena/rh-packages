import {conf} from '../conf.js';
import {checkDataForMissingProperties} from 'sql-util';
import {complete} from 'rf-util';

export class UserGroupService {
    /**
     * Complete the data object with the userId property if not exists. 
     * @param {{group: string, groupId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserId(data) {
        if (!data.groupId && data.group)
            data.groupId = await conf.global.user.getIdForUsername(data.group);
    
        return data;
    }

    /**
     * Complete the data object with the groupId property if not exists. 
     * @param {{group: string, groupId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeGroupId(data) {
        if (!data.groupId && data.group)
            data.groupId = await conf.global.user.getIdForUsername(data.group);

        return data;
    }

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
     * Creates a new user group row into DB.
     * @param {{
     *  user: string,
     *  userId: int,
     *  group: string,
     *  groupId: int,
     * }} data - data for the new UserGroup.
     * @returns {Promise{UserGroup}}
     */
    static async create(data) {
        await UserGroupService.completeUserId(data);
        await UserGroupService.completeGroupId(data);
        await UserGroupService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');

        return conf.global.models.UserGroup.create(data);
    }

    /**
     * Gets a list of user groups.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{GroupList}}
     */
    static async getList(options) {
        return conf.global.models.UserGroup.findAll(options);
    }

    /**
     * Gets a list of user group for a given user ID list.
     * @param {integer|[]integer} userId - user ID to get its groups.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{GroupList}}
     */
    static getForUserId(userId, options) {
        return UserGroupService.getList(complete(options, {where:{userId}}));
    }

    /**
     * Creates a new user group row into DB if not exists.
     * @param {data} data - data for the new UserGroup @see create.
     * @returns {Promise{UserGroup}}
     */
    static async createIfNotExists(data, options) {
        await UserGroupService.completeUserId(data);
        await UserGroupService.completeGroupId(data);
        await UserGroupService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');
        
        const rows = await UserGroupService.getList(complete(options, {where:{userId: data.userId, groupId: data.groupId}}));
        if (rows && rows.length)
            return true;

        return UserGroupService.create(data);
    }
}