'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class TagService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Tag;
    references = {
        tagCategory: conf.global.services.TagCategory,
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'tag';

    async validateForCreation(data) {
        if (data.id)
            throw new CheckError(loc._cf('tag', 'ID parameter is forbidden for creation.'));

        
        await checkDataForMissingProperties(data, 'Tag', 'name');

        checkParameterStringNotNullOrEmpty(data.name,          loc._cf('tag', 'Name'));
        checkParameterStringNotNullOrEmpty(data.tagCategoryId, loc._cf('tag', 'Tag category'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {where: {tagCategoryId: data.tagCategoryId}, skipNoRowsError: true}))
            throw new ConflictError(loc._cf('tag', 'Exists another tag with that name.'));

        return true;
    }

    async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }
}