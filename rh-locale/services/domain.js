'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class DomainService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Domain;

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Domain', 'name', 'title');
    }
}