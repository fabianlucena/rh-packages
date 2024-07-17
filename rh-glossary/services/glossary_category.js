import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryCategoryService extends Service.IdUuidEnableNameTitleDescriptionTranslatable {
  references = {
    glossary: true,
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];
  eventBus = conf.global.eventBus;
}