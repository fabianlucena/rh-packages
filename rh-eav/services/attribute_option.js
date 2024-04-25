import { ServiceIdUuidNameTitleDescriptionTranslatable } from 'rf-service';

export class EavAttributeOptionService extends ServiceIdUuidNameTitleDescriptionTranslatable {
  references = {
    attribute: 'eavAttributeService',
  };
}