import {EavEntityTypeService} from './entity_type.js';
import {EavAttributeService} from './attribute.js';
import {EavAttributeOptionService} from './attribute_option.js';
import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class EavValueOptionService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavValueOption;
    references = {
        entityType: EavEntityTypeService.singleton(),
        attributeType: EavAttributeService.singleton(),
        attributeOption: EavAttributeOptionService.singleton(),
    };

    async getListOptions(options) {
        options ||= {};

        if (options.includeAtributeOption) {
            let attributes = options.includeAtributeOption || [];
            if (attributes === true) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable', 'description'];
            }

            completeIncludeOptions(
                options,
                'EavAttributeOption',
                {
                    model: conf.global.models.EavAttributeOption,
                    attributes,
                }
            );
        }
        
        return super.getListOptions(options);
    }
}