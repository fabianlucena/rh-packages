import {ServiceEnabledModuleTranslatable} from 'rf-service';
import {conf} from '../conf.js';
import {checkDataForMissingProperties} from 'sql-util';

export class ShareService extends ServiceEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Share;
    moduleModel = conf.global.models.Module;
    references = {
        objectName: {
            service: conf.global.services.ModelEntityName?.singleton(),
            createIfNotExists: true,
        },
        user: conf.global.services.User.singleton(),
        type: conf.global.services.ShareType.singleton(),
    };
    defaultTranslationContext = 'share';

    constructor() {
        if (!conf.global.services.ModelEntityName) {
            throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
        }

        super();
    }
    
    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');
        return super.validateForCreation(data);
    }

    /**
     * Creates a new share type row into DB if not exists.
     * @param {data} data - data for the new share type @see create.
     * @returns {Promise{ShareType}}
     */
    async createIfNotExists(data, options) {
        this.completeReferences(data);
        await checkDataForMissingProperties(data, 'Share', 'objectNameId', 'objectId', 'userId', 'typeId');

        const rows = await ShareService.getList(
            {
                where: {
                    objectNameId: data.objectNameId,
                    objectId: data.objectId,
                    userId: data.userId,
                    typeId: data.typeId,
                }
            },
            {
                attributes: ['id'],
                skipNoRowsError: true,
                ...options,
            }
        );
        if (rows?.length) {
            return rows[0];
        }

        return ShareService.create(data);
    }

    async deleteForObjectNameAndId(objectName, objectId) {
        const objectNameId = await conf.global.services.ObjectName.singleton().getIdForName(objectName);
        return this.deleteFor({objectNameId, objectId});
    }
}