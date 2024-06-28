import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleEnabledTranslatable } from 'rf-service';

export class ModuleService extends ServiceIdUuidNameTitleEnabledTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.Module;
  defaultTranslationContext = 'module';
}