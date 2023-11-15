import {EavEntityTypeService} from './entity_type.js';
import {EavAttributeService} from './attribute.js';
import {conf} from '../conf.js';
import {ServiceIdUuidName} from 'rf-service';

export class EavValueTextService extends ServiceIdUuidName {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavValueText;
    references = {
        entityType: EavEntityTypeService.singleton(),
        attributeType: EavAttributeService.singleton(),
    };
}