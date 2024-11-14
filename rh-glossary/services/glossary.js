import dependency from 'rf-dependency';
import { conf } from '../conf.js';
import { Service } from 'rf-service';

export class GlossaryService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    projects: {
      service: 'project',
      through: 'glossaryProject',
      attributes: ['uuid', 'name', 'title'],
    },
  };
  defaultTranslationContext = 'glossary';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];
  hiddenColumns = ['projectId'];
  eventBus = conf.global.eventBus;

  init() {
    this.projectService =    dependency.get('projectService',    null);
    this.getCurrentProject = dependency.get('getCurrentProject', null);

    super.init();
  }

  async getInterface(options) {
    const gridActions = [],
      permissions = options?.permissions;
    if (permissions?.includes('glossary.create')) gridActions.push('create');
    if (permissions?.includes('glossary.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions?.includes('glossary.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('glossary', 'Enabled'),
        placeholder: loc => loc._c('glossary', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       loc => loc._c('glossary', 'Title'),
        placeholder: loc => loc._c('glossary', 'Type the title here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        onValueChanged: {
          mode: {
            create:       true,
            defaultValue: false,
          },
          action:   'setValues',
          override: false,
          map: {
            name: {
              source:   'title',
              sanitize: 'dasherize',
            },
          },
        },
      },
      {
        name:       'name',
        type:       'text',
        label:       loc => loc._c('glossary', 'Name'),
        placeholder: loc => loc._c('glossary', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
    ];

    if (this.projectService) {
      fields.push({
        name:            'projects.uuid',
        gridName:        'projects',
        type:            'select',
        gridType:        'list',
        singleProperty:  'title',
        label:           loc => loc._c('glossary', 'Projects'),
        placeholder:     loc => loc._c('glossary', 'Select the projects'),
        isField:         true,
        isColumn:        true,
        multiple:        true,
        loadOptionsFrom: {
          service: 'glossary/project',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      });
    }

    fields.push({
      name:        'description',
      type:        'textArea',
      label:       loc => loc._c('glossary', 'Description'),
      placeholder: loc => loc._c('glossary', 'Type the description here'),
      isField:     true,
      isDetail:    true,
    });

    const result = {
      title:     loc => loc._c('glossary', 'Glossary'),
      gridTitle: loc => loc._c('glossary', 'Glossaries'),
      load: {
        service: 'glossary',
        method:  'get',
      },
      getDefaultValues: true,
      action: 'glossary',
      gridActions,
      fields,
      fieldsFilter: conf?.glossary,
    };

    return result;
  }

  async getDefault(options) {
    const row = {};

    if (options?.context?.req && this.projectService && this.getCurrentProject) {
      const project = await this.getCurrentProject(options.context);
      if (project) {
        row.project = { uuid: project.uuid };
      }
    };

    return row;
  }
}