'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class DomainService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Domain;

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Domain', 'name', 'title');
    }
}