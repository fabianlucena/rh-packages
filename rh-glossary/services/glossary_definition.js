import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryDefinitionService extends Service.IdUuidEnableTranslatable {
  references = {
    term: {
      service: 'glossaryTerm',
      createIfNotExists: true,
    },
    type: 'glossaryType',
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'definition'];
  eventBus = conf.global.eventBus;

  async getInterface() {
    const gridActions = [];
    gridActions.push('create');
    gridActions.push('enableDisable', 'edit');
    gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('glossary', 'Enabled'),
        placeholder: loc => loc._c('glossary', 'Check for enable and uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'term.glossary.uuid',
        gridName:    'term.glossary.title',
        type:        'select',
        gridType:    'text',
        label:       loc => loc._c('glossary', 'Glossary'),
        placeholder: loc => loc._c('glossary', 'Select the glossary'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary-definition/glossary',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'term.category.uuid',
        gridName:    'term.category.title',
        type:        'select',
        gridType:    'text',
        label:       loc => loc._c('glossary', 'Category'),
        placeholder: loc => loc._c('glossary', 'Select the category'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary-definition/category',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'term.name',
        type:        'text',
        label:       loc => loc._c('glossary', 'Term'),
        placeholder: loc => loc._c('glossary', 'Type the term here'),
        isField:     true,
        isColumn:    true,
        required:    true,
      },
      {
        name:        'type.uuid',
        gridName:    'type.title',
        type:        'select',
        gridType:    'text',
        label:       loc => loc._c('glossary', 'Type'),
        placeholder: loc => loc._c('glossary', 'Select the type'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary-definition/type',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'definition',
        type:        'textArea',
        label:       loc => loc._c('glossary', 'Definition'),
        placeholder: loc => loc._c('glossary', 'Type the definition here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: loc => loc._c('glossary', 'Definition'),
      gridTitle: loc => loc._c('glossary', 'Definitions'),
      load: {
        service: 'glossary-definition',
        method:  'get',
      },
      action: 'glossary-definition',
      gridActions,
      fields,
    };

    return result;
  }

  async getOptions() {
    return {
      include: {
        term: {
          include: {
            glossary: true,
            category: true,
          },
        },
        type: true,
      }
    };
  }

  async validate(data) {
    return super.validate(data);
  }
}