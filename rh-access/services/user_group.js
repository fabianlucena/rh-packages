import {conf} from '../conf.js';
import {ServiceModuleTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class UserGroupService extends ServiceModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.UserGroup;
    references = {
        user: {
            service: conf.global.services.User.singleton(),
            name: 'username',
            Name: 'User',
            idPropertyName: 'userId',
            uuidPropertyName: 'userUuid',
            getIdForName: 'getIdForUsername',
        },
        group: {
            service: conf.global.services.User.singleton(),
            name: 'group',
            Name: 'Gser',
            idPropertyName: 'userId',
            uuidPropertyName: 'userUuid',
            getIdForName: 'getIdForUsername',
        },
    };
    defaultTranslationContext = 'userGroup';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');
        return data;
    }

    /**
     * Creates a new user group row into DB if not exists.
     * @param {data} data - data for the new UserGroup @see create.
     * @returns {Promise{UserGroup}}
     */
    async createIfNotExists(data, options) {
        await this.completeReferences(data);
        await checkDataForMissingProperties(data, 'UserGroupService', 'userId', 'groupId');
        
        const rows = await this.getList({...options, where: {...options.where, userId: data.userId, groupId: data.groupId}});
        if (rows?.length) {
            return rows[0];
        }

        return this.create(data);
    }
}