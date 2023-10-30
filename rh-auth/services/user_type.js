import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnableModuleTranslatable} from 'rf-service';

export class UserTypeService extends ServiceIdUuidNameTitleEnableModuleTranslatable {
    sequelize = conf.global.sequelize;
    moduleModel = conf.global.models.Module;
    model = conf.global.models.UserType;
    defaultTranslationContext = 'userType';
}