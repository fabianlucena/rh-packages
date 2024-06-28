import { Service } from 'rf-service';

export class EavAttributeOptionService extends Service.IdUuidNameUniqueTitleDescriptionTranslatable {
  references = {
    attribute: 'eavAttributeService',
  };
}