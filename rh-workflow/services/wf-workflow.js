import { Service } from 'rf-service';

export class WfWorkflowService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    modelEntityName: { createIfNotExists: true },
  };
  defaultTranslationContext = 'workflow';
}