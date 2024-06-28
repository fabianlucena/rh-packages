import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable } from 'rf-service';

export class WfWorkflowTypeService extends ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.WfWorkflowType;
  moduleService = conf.global.services.Module.singleton();
  references = {
    modelEntityName: {
      service: conf?.global?.services?.ModelEntityName?.singleton(),
      createIfNotExists: true,
    }
  };
  defaultTranslationContext = 'workflow';
}