import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryTypeService extends Service.IdUuidEnableNameTitleDescriptionTranslatable {
  references = {
    glossary: {
      attributes: ['uuid', 'name', 'title']
    },
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description', 'isTranslatable'];
  eventBus = conf.global.eventBus;
}