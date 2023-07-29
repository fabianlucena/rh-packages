'use strict';

import {completeIncludeOptions, getIncludedModelOptions} from 'sql-util';
import {conf} from '../conf.js';
import {ServiceIdTranslatable} from 'rf-service';

export class LogService extends ServiceIdTranslatable {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
    model = conf.global.models.Log;
    models = conf.global.models;

    async validateForCreation(data) {
        if (data.ref !== undefined && isNaN(data.ref))
            delete data.ref;
            
        return data;
    }

    async getListOptions(options) {
        options = await super.getListOptions(options);

        if (options.includeUser) {
            completeIncludeOptions(
                options,
                'Session',
                {
                    model: this.models.Session,
                    attributes: ['id'],
                }
            );

            completeIncludeOptions(
                getIncludedModelOptions(options, this.models.Session),
                'User',
                {
                    model: this.models.User,
                    attributes: ['username', 'displayName'],
                }
            );
        }

        return options;
    }

    async translateRow(row, loc) {
        row = await super.translateRow(row, loc);

        row.dateTime = await loc.strftime('%x %X.%f', row.dateTime);

        return row;
    }

    async getMaxRef() {
        const sequelize = this.sequelize;
        const result = await this.model.findAll({attributes:[[sequelize.fn('max', sequelize.col('ref')), 'maxRef']]});
        if (!result?.length)
            return;

        const row = result[0];
        const maxRef = row.toJSON().maxRef;

        return maxRef;
    }
}