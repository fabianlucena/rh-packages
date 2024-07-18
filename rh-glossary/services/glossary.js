import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryService extends Service.IdUuidEnableNameUniqueTitleDescription {
  references = {
    project: true,
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];
  eventBus = conf.global.eventBus;
}