import { Service } from 'rf-service';

export class WfTypeService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    modelEntityName: { createIfNotExists: true },
  };
  defaultTranslationContext = 'workflow';
}