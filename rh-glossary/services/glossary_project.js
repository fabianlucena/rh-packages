import { Service } from 'rf-service';

export class GlossaryProjectService extends Service.Translatable {
  references = {
    glossary: {
      attributes: ['uuid', 'name', 'title']
    },
    project: {
      attributes: ['uuid', 'name', 'title']
    },
  };
  defaultTranslationContext = 'glossary';
}