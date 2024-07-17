import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryDefinitionService extends Service.IdUuidEnableNameTitleDescription {
  references = {
    term: 'glossaryTerm',
    type: 'glossaryType',
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'definition'];
  eventBus = conf.global.eventBus;
}