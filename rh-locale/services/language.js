'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {checkDataForMissingProperties} from 'sql-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class LanguageService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Language;
    references = {
        parent: conf.global.services.Language,
    };

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'name');

        const row = await this.getForName(data.name, {skipNoRowsError: true});
        if (row)
            throw new ConflictError(loc._f('Cannot create the language because already exists.'));

        if (!data.parentId) {
            const nameParts = data.name.split('-');
            if (nameParts.length === 2) {
                const parent = await this.createIfNotExists({name: nameParts[0].trim(), title: nameParts[0].trim()});
                data.parentId = parent.id;
            }
        }

        return true;
    }
}