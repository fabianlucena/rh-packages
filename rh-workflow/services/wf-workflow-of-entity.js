import { Service } from 'rf-service';

export class WfWorkflowOfEntityService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    modelEntityName: {
      createIfNotExists: true,
      attributes: ['uuid', 'name'],
      whereColumn: 'name',
    },
    workflow: 'wfWorkflowService',
  };
  defaultTranslationContext = 'workflow';
  translatableColumns = [
    'title',
    'description',
    'currentStatusTitle',
    'assigneeTitle',
    'workflowTitle',
  ];

  async getListOptions(options) {
    options = { ...options };

    if (options.include?.modelEntityName
      || options.where?.modelEntityName
    ) {
      if (options.include?.modelEntityName) {
        if (options.include.modelEntityName === true) {
          options.include.modelEntityName = {};
        }

        if (!options.include.modelEntityName.attributes) {
          options.include.modelEntityName.attributes = ['uuid', 'name'];
        }
      } else {
        options.include ??= {};
        options.include.modelEntityName = {};
      }

      if (options.isEnabled !== undefined) {
        options.include.modelEntityName.where = {
          isEnabled: options.isEnabled,
          ...options.include.modelEntityName.where,
        };
      }

      if (options.where?.modelEntityName) {
        options.include.modelEntityName.where = {
          ...options.where.modelEntityName,
          ...options.include.modelEntityName.where,
        };
        delete options.where?.modelEntityName;
      }
    }
        
    return super.getListOptions(options);
  }

  async getForEntityName(entityName, options) {
    return this.getFor({ modelEntityName: { name: entityName }}, options);
  }

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
        name:            'workflow.uuid',
        gridName:        'workflow.name',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('workflow', 'Workflow'),
        placeholder:     loc => loc._c('workflow', 'Select the workflow'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'workflow-of-entity/workflow',
          value:   'uuid',
          text:    'title',
        },
      },
      {
        name:            'modelEntityName.uuid',
        gridName:        'modelEntityName.name',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('workflow', 'Model entity'),
        placeholder:     loc => loc._c('workflow', 'Select the model entity'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'workflow-of-entity/model-entity-name',
          value:   'uuid',
          text:    'name',
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
      {
        legend:       loc => loc._c('workflow', 'Current status'),
        type:        'fields',
        fields:      [
          {
            name:        'showCurrentStatusInColumn',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Column'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as column grid'),
            value:       true,
            isDetail:    true,
            isField:     true,
          },
          {
            name:        'showCurrentStatusInDetail',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Detail'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as detail grid'),
            value:       false,
            isDetail:    true,
            isField:     true,
          },
          {
            name:       'currentStatusName',
            type:       'text',
            label:       loc => loc._c('workflow', 'Name'),
            placeholder: loc => loc._c('workflow', 'Type the current status property name here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
          {
            name:       'currentStatusTitle',
            type:       'text',
            label:       loc => loc._c('workflow', 'Title'),
            placeholder: loc => loc._c('workflow', 'Type the current status field title here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
        ],
      },
      {
        legend:       loc => loc._c('workflow', 'Assignee'),
        type:        'fields',
        fields:      [
          {
            name:        'showAssigneeInColumn',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Column'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as column grid'),
            value:       true,
            isDetail:    true,
            isField:     true,
          },
          {
            name:        'showAssigneeInDetail',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Detail'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as detail grid'),
            value:       false,
            isDetail:    true,
            isField:     true,
          },
          {
            name:       'assigneeName',
            type:       'text',
            label:       loc => loc._c('workflow', 'Name'),
            placeholder: loc => loc._c('workflow', 'Type the assignee name here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
          {
            name:       'assigneeTitle',
            type:       'text',
            label:       loc => loc._c('workflow', 'Title'),
            placeholder: loc => loc._c('workflow', 'Type the assignee field title here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
        ],
      },
      {
        legend:       loc => loc._c('workflow', 'Workflow'),
        type:        'fields',
        fields:      [
          {
            name:        'showWorkflowInColumn',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Column'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as detail grid'),
            value:       true,
            isDetail:    true,
            isField:     true,
          },
          {
            name:        'showWorkflowInDetail',
            type:        'checkbox',
            gridType:    'checkFail',
            label:       loc => loc._c('workflow', 'Detail'),
            placeholder: loc => loc._c('workflow', 'Check for show or uncheck for hide as detail grid'),
            value:       false,
            isDetail:    true,
            isField:     true,
          },
          {
            name:       'workflowName',
            type:       'text',
            label:       loc => loc._c('workflow', 'Name'),
            placeholder: loc => loc._c('workflow', 'Type the workflow name here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
          {
            name:       'workflowTitle',
            type:       'text',
            label:       loc => loc._c('workflow', 'Title'),
            placeholder: loc => loc._c('workflow', 'Type the workflow field title here'),
            isField:     true,
            isDetail:    true,
            required:    true,
          },
        ],
      },
    ];

    const result = {
      title:     loc => loc._c('workflow', 'Workflow of entity'),
      gridTitle: loc => loc._c('workflow', 'Workflows of entities'),
      load: {
        service: 'workflow-of-entity',
        method:  'get',
      },
      action: 'workflow-of-entity',
      gridActions,
      fields,
    };

    return result;
  }
}