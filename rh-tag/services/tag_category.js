'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {addEnabledFilter} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class TagCategoryService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Tag;
    shareObject = 'Tag';
    shareService = conf.global.services.Share;
    references = {
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'tag';

    async validateForCreation(data) {
        if (data.id)
            throw new CheckError(loc._cf('tag', 'ID parameter is forbidden for creation.'));

        checkParameterStringNotNullOrEmpty(data.name,  loc._cf('tag', 'Name'));
        checkParameterStringNotNullOrEmpty(data.title, loc._cf('tag', 'Title'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {skipNoRowsError: true}))
            throw new ConflictError(loc._cf('tag', 'Exists another tag category with that name.'));

        return true;
    }

    async getListOptions(options) {
        if (!options)
            options = {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description', 'isTranslatable'];
        }

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        return options;
    }
}