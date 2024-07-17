import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryTypeService extends Service.IdUuidEnableNameTitleDescriptionTranslatable {
  references = {
    project: true,
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description', 'isTranslatable'];
  eventBus = conf.global.eventBus;
}