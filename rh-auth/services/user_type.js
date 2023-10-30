import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnabledModuleTranslatable} from 'rf-service';

export class UserTypeService extends ServiceIdUuidNameTitleEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    ModuleService = conf.global.models.Module;
    model = conf.global.models.UserType;
    defaultTranslationContext = 'userType';
}