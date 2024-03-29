import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class DomainService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Domain;

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Domain', 'name', 'title');
        return super.validateForCreation(data);
    }
}