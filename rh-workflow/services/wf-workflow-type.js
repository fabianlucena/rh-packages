import { Service } from 'rf-service';

export class WfWorkflowTypeService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    modelEntityName: { createIfNotExists: true },
  };
  defaultTranslationContext = 'workflow';
}