import { Service } from 'rf-service';

export class WfWorkflowService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  defaultTranslationContext = 'workflow';
  translatableColumns = [
    'title',
    'description',
  ];

  async getInterface(options) {
    const gridActions = [],
      permissions = options?.context?.req?.permissions;
    if (permissions.includes('workflow.create')) gridActions.push('create');
    if (permissions.includes('workflow.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions.includes('workflow.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('workflow', 'Enabled'),
        placeholder: loc => loc._c('workflow', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       loc => loc._c('workflow', 'Title'),
        placeholder: loc => loc._c('workflow', 'Type the title here'),
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
        label:       loc => loc._c('workflow', 'Name'),
        placeholder: loc => loc._c('workflow', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       loc => loc._c('workflow', 'Description'),
        placeholder: loc => loc._c('workflow', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title:     loc => loc._c('workflow', 'Workflow'),
      gridTitle: loc => loc._c('workflow', 'Workflows'),
      load: {
        service: 'workflow',
        method:  'get',
      },
      action: 'workflow',
      gridActions,
      fields,
    };

    return result;
  }
}