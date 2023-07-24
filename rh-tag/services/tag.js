'use strict';

import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties, completeIncludeOptions} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class TagService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Tag;
    references = {
        tagCategory: {
            service: conf.global.services.TagCategory,
            otherName: 'category',
        },
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
        if (options.includeTagCategory || options?.where?.tagCategory) {
            let attributes;
            if (options.includeTagCategory) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
                delete options.includeTagCategory;
            } else
                attributes = [];

            let where;
            if (options?.where?.tagCategory) {
                where = {name: options.where.tagCategory};
                delete options.where.tagCategory;
            }

            completeIncludeOptions(
                options,
                'tagCategory',
                {
                    model: conf.global.models.TagCategory,
                    attributes,
                    where,
                }
            );
        }

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