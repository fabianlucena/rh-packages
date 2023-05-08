import {conf} from '../conf.js';
import {complete} from 'rf-util';
import {checkDataForMissingProperties} from 'sql-util';

export class ShareService {
    /**
     * Complete the data object with the objectNameId property if not exists. 
     * @param {{objectName: string, objectNameId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeObjectNameId(data) {
        if (!data.objectNameId && data.objectName)
            data.objectNameId = await conf.global.services.ObjectName.getIdForNameCreateIfNotExists({name: data.objectName});

        return data;
    }

    /**
     * Complete the data object with the userId property if not exists. 
     * @param {{username: string, userId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeUserId(data) {
        if (!data.userId && data.username)
            data.userId = await conf.global.services.User.getIdForUsername(data.username);

        return data;
    }
    
    /**
     * Complete the data object with the typeId property if not exists. 
     * @param {{type: string, typeId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeTypeId(data) {
        if (!data.typeId && data.type)
            data.typeId = await conf.global.services.ShareType.getIdForName(data.type);

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
     * Creates a new Share row into DB.
     * @param {{name: string, title: {string}} data - data for the new Share.
     *  - name: must be unique.
     * @returns {Promise{Share}}
     */
    static async create(data) {
        await ShareService.completeObjectNameId(data);
        await ShareService.completeUserId(data);
        await ShareService.completeTypeId(data);
        await ShareService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');

        return conf.global.models.Share.create(data);
    }

    /**
     * Gets a list of shares.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{ShareList}}
     */
    static getList(options) {
        return conf.global.models.Share.findAll(complete(options, {}));
    }

    /**
     * Creates a new share type row into DB if not exists.
     * @param {data} data - data for the new share type @see create.
     * @returns {Promise{ShareType}}
     */
    static async createIfNotExists(data, options) {
        await ShareService.completeObjectNameId(data);
        await ShareService.completeUserId(data);
        await ShareService.completeTypeId(data);
        await ShareService.completeOwnerModuleId(data);

        await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');

        return ShareService.getList({where: {objectNameId: data.objectNameId, objectId: data.objectId, userId: data.userId, typeId: data.typeId}}, {attributes: ['id'], skipNoRowsError: true, ...options})
            .then(row => {
                if (row)
                    return row;

                return ShareService.create(data);
            });
    }

    static async deleteForObjectNameAndId(objectName, objectId) {
        const objectNameId = await conf.global.services.ObjectName.getIdForName(objectName);
        return conf.global.models.Share.destroy({where:{objectNameId, objectId}});
    }
}