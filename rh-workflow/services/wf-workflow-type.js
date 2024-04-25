import { ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable } from 'rf-service';

export class WfWorkflowTypeService extends ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable {
  references = {
    modelEntityName: { createIfNotExists: true },
  };
  defaultTranslationContext = 'workflow';
}