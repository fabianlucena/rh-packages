'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class ContextService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Context;

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Context', 'name', 'title');
    }
}