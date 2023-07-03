'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';

export class IdentityTypeService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.IdentityType;
    defaultTranslationContext = 'identityType';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'IdentityType', 'name', 'title');

        return true;
    }
}