import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledModuleTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {checkParameterStringNotNullOrEmpty} from 'rf-util';
import {_ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class TagService extends ServiceIdUuidNameEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
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
        checkParameterStringNotNullOrEmpty(data.tagCategoryId, loc._cf('tag', 'Tag category'));
        return super.validateForCreation(data);
    }

    async checkNameForConflict(name, data) {
        if (await this.getForName(name, {where: {tagCategoryId: data.tagCategoryId}, skipNoRowsError: true})) {
            throw new _ConflictError(loc._cf('tag', 'Exists another tag with that name.'));
        }
    }

    async getListOptions(options) {
        if (options.includeTagCategory || options?.where?.tagCategory) {
            let attributes;
            if (options.includeTagCategory) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
                delete options.includeTagCategory;
            } else {
                attributes = [];
            }

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

        return super.getListOptions(options);
    }
}