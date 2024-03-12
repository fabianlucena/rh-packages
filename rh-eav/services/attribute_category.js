import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionTranslatable} from 'rf-service';

export class EavAttributeCategoryService extends ServiceIdUuidNameTitleDescriptionTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavAttributeCategory;
}