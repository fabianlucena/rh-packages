'use strict';

import {conf} from '../conf.js';
import {ServiceIdTranslatable} from 'rf-service';

export class LogService extends ServiceIdTranslatable {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
    model = conf.global.models.Log;
    models = conf.global.models;

    async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {type:     {[Op.like]: q}},
                    {session:  {[Op.like]: q}},
                    {message:  {[Op.like]: q}},
                    {jsonData: {[Op.like]: q}},
                ],
            };
        }

        return options;
    }

    async translateRow(row, loc) {
        row = await super.translateRow(row, loc);

        row.dateTime = await loc.strftime('%x %X.%f', row.dateTime);

        return row;
    }
}