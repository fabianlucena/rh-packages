import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryTermService extends Service.IdUuidEnableNameTitleDescription {
  references = {
    glossary: true,
    category: 'glossaryCategory',
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'term'];
  eventBus = conf.global.eventBus;
}