import { Service } from 'rf-service';
import { CheckError } from 'rf-util';
import { ConflictError } from 'http-util';

export class WfTransitionService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    from: 'wfStatusService',
    to:   'wfStatusService',
  };
  defaultTranslationContext = 'workflow';

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
        name:            'from.uuid',
        gridName:        'from.title',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('workflow', 'From'),
        placeholder:     loc => loc._c('workflow', 'Select the status from'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'workflow-transition/status',
          value:   'uuid',
          text:    'title',
        },
      },
      {
        name:            'to.uuid',
        gridName:        'to.title',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('workflow', 'To'),
        placeholder:     loc => loc._c('workflow', 'Select the status to'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'workflow-transition/status',
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
    ];

    const result = {
      title:     loc => loc._c('workflow', 'Transition'),
      gridTitle: loc => loc._c('workflow', 'Transitions'),
      load: {
        service: 'workflow-transition',
        method:  'get',
      },
      action: 'workflow-transition',
      gridActions,
      fields,
    };

    return result;
  }


  async validateForCreation(data) {
    if (!data?.typeId) {
      throw new CheckError(loc => loc._c('workflow', 'Workflow type parameter is missing or workflow type does not exist.'));
    }

    if (!data?.fromId) {
      throw new CheckError(loc => loc._c('workflow', 'From parameter is missing or from status does not exist.'));
    }

    if (!data?.toId) {
      throw new CheckError(loc => loc._c('workflow', 'To parameter is missing or to status does not exist.'));
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(title) {
    const rows = await this.getFor({ title }, { limit: 1 });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('workflow', 'Exists another row with that title.'));
    }
  }
}