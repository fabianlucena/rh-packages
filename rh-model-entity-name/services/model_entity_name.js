import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class ModelEntityNameService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.ModelEntityName;
    defaultTranslationContext = 'modelEntityName';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'ModelEntityName', 'name');
        return super.validateForCreation(data);
    }
}