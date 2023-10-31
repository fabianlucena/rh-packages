import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';
import {ucfirst} from 'rf-util';

export class ContextService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Context;

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Context', 'name');
        data.title ??= ucfirst(data.name);
        return super.validateForCreation(data);
    }
}