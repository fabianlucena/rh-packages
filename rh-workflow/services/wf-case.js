import { Service } from 'rf-service';

export class WfCaseService extends Service.IdUuidEnableTranslatable {
  references = {
    workflow: 'wfWorkflowOfEntityService',
    branches: 'wfBranchService',
  };
  defaultTranslationContext = 'workflow';

  async getInterface(options) {
    const gridActions = [],
      permissions = options?.permissions;
    if (permissions?.includes('workflow.create')) gridActions.push('create');
    if (permissions?.includes('workflow.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions?.includes('workflow.delete')) gridActions.push('delete');
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
        name:        'entityUuid',
        type:        'text',
        label:       loc => loc._c('workflow', 'Entity UUID'),
        isField:     true,
        isColumn:    true,
      },
    ];

    const result = {
      title:     loc => loc._c('workflow', 'Case'),
      gridTitle: loc => loc._c('workflow', 'Cases'),
      load: {
        service: 'workflow-case',
        method:  'get',
      },
      action: 'workflow-case',
      gridActions,
      fields,
    };

    return result;
  }

  async createForWorkflowIdAndEnrityUuid(workflowId, entityUuid) {
    return this.create({ workflowId, entityUuid });
  }

  async getForWorkflowIdAndEnrityUuid(workflowId, entityUuid, { loc }) {
    return this.getSingleFor(
      {
        workflowId,
        entityUuid,
      },
      {
        include: {
          branches: {
            include: {
              status:   true,
              assignee: true,
            },
          },
        },
        skipNoRowsError: true,
        loc,
      },
    );
  };
}