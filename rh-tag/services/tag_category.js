import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnabledTranslatable} from 'rf-service';

export class TagCategoryService extends ServiceIdUuidNameTitleEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.TagCategory;
    shareObject = 'Tag';
    shareService = conf.global.services.Share.singleton();
    references = {
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'tag';

    async getListOptions(options) {
        if (!options)
            options = {};

        if (options?.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description', 'isTranslatable'];
        }

        return super.getListOptions(options);
    }
}