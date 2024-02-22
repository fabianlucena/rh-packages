import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnabledModuleTranslatable} from 'rf-service';

export class UserTypeService extends ServiceIdUuidNameTitleEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.UserType;
    moduleModel = conf.global.models.Module;
    moduleService = conf.global.services.Module.singleton();
    defaultTranslationContext = 'userType';
}