import { Service } from 'rf-service';
import dependency from 'rf-dependency';

export class WfStatusService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    workflow:  'wfWorkflow',
    isInitial: 'wfStatusIsInitial',
    isFinal:   'wfStatusIsFinal',
  };
  defaultTranslationContext = 'workflow';

  init() {
    this.wfStatusIsInitialService = dependency.get('wfStatusIsInitialService');
    this.wfStatusIsFinalService =   dependency.get('wfStatusIsFinalService');

    super.init();
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
        gridName:        'workflow.title',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('workflow', 'Workflow'),
        placeholder:     loc => loc._c('workflow', 'Select the workflow'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'workflow-status/workflow',
          value:   'uuid',
          text:    'title',
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
        name:        'isInitial',
        type:        'check',
        label:       loc => loc._c('workflow', 'Initial'),
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isFinal',
        type:        'check',
        label:       loc => loc._c('workflow', 'Final'),
        isField:     true,
        isColumn:    true,
      },
    ];

    const result = {
      title:     loc => loc._c('workflow', 'Workflow'),
      gridTitle: loc => loc._c('workflow', 'Workflows'),
      load: {
        service: 'workflow-status',
        method:  'get',
      },
      getDefaultValues: true,
      action: 'workflow-status',
      gridActions,
      fields,
    };

    return result;
  }

  async create(data, options) {
    data = { ...data };

    const isInitial = data.isInitial;
    delete data.isInitial;

    const isFinal = data.isFinal;
    delete data.isFinal;

    const result = await super.create(data, options);
    const id = result.id;

    if (isInitial) {
      await this.wfStatusIsInitialService.create({ statusId: id }, options);
    }

    if (isFinal) {
      await this.wfStatusIsFinalService.create({ statusId: id }, options);
    }

    return result;
  }

  async update(data, options) {
    data = { ...data };

    const isInitial = data.isInitial;
    delete data.isInitial;

    const isFinal = data.isFinal;
    delete data.isFinal;

    const result = super.update(data, options);

    if (isInitial !== undefined || isFinal !== undefined) {
      const rows = this.getList({ ...options, attributes: ['id'] });
      const idList = rows.map(r => r.id);

      if (isInitial !== undefined) {
        if (isInitial) {
          for (const id of idList) {
            await this.wfStatusIsInitialService.createIfNotExists({ statusId: id }, options);
          }
        } else {
          await this.wfStatusIsInitialService.deleteFor({ statusId: idList }, options);
        }
      }

      if (isFinal !== undefined) {
        if (isFinal) {
          for (const id of idList) {
            await this.wfStatusIsFinalService.createIfNotExists({ statusId: id }, options);
          }
        } else {
          await this.wfStatusIsFinalService.deleteFor({ statusId: idList }, options);
        }
      }
    }

    return result;
  }

  async delete(options) {
    const rows = this.getList({ ...options, attributes: ['id'] });
    const idList = rows.map(r => r.id);

    await this.wfStatusIsInitialService.deleteFor({ statusId: idList }, options);
    await this.wfStatusIsFinalService.deleteFor({ statusId: idList }, options);

    return super.delete(options);
  }
}