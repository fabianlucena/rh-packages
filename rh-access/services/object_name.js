import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class ObjectNameService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.ObjectName;
    defaultTranslationContext = 'objectName';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'ObjectName', 'name');
        return super.validateForCreation(data);
    }
}