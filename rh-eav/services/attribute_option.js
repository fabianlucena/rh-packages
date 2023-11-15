import {EavAttributeService} from './attribute.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionTranslatable} from 'rf-service';

export class EavAttributeOptionService extends ServiceIdUuidNameTitleDescriptionTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavAttributeOption;
    references = {
        attribute: EavAttributeService.singleton(),
    };
}