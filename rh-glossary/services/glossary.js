import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    project: {
      attributes: ['uuid', 'name', 'title']
    },
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];
  hiddenColumns = ['projectId'];
  eventBus = conf.global.eventBus;
}