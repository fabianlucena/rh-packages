import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';

export const conf = localConf;

conf.configure = configure;
conf.init = init;
conf.updateData = updateData;
conf.modelEntityNameCache = {};
conf.workflowsCache = {};
conf.fieldsCache = {};

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }

  global.eventBus?.$on('interface.grid.get', interfaceGridGet);
  //global.eventBus?.$on('interface.form.get', interfaceFormGet);
  global.eventBus?.$on('getted', getted);
  /*global.eventBus?.$on('created', created);
    global.eventBus?.$on('updated', updated);
    global.eventBus?.$on('deleting', deleting);
    global.eventBus?.$on('deleted', deleted);
    global.eventBus?.$on('sanitized', sanitized);*/
}

async function init() {
  conf.modelEntityNameService =    dependency.get('modelEntityNameService');
  conf.wfWorkflowOfEntityService = dependency.get('wfWorkflowOfEntityService');
  conf.wfWorkflow =                dependency.get('wfWorkflowService');
  conf.wfStatusService =           dependency.get('wfStatusService');
  conf.wfTransitionService =       dependency.get('wfTransitionService');
  conf.wfCaseService =             dependency.get('wfCaseService');
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.workflows,            async data => updateWfWorkflow(data));
  await runSequentially(data?.workflowsStatuses,    async data => updateWfStatus(data));
  await runSequentially(data?.workflowsTransitions, async data => updateWfTransition(data));
  await runSequentially(data?.workflowsOfEntities,  async data => updateWfWorkflowOfEntity(data));
}

async function updateWfWorkflowOfEntity(workflowOfEntity) {
  const defaultData = { ownerModule: workflowOfEntity.ownerModule };
  
  if (typeof workflowOfEntity.workflow === 'object') {
    await updateWfWorkflow({ ...defaultData, ...workflowOfEntity.workflow });
    workflowOfEntity = { ...workflowOfEntity, workflow: workflowOfEntity.workflow.name };
  }

  defaultData.workflow = workflowOfEntity.workflow;

  if (workflowOfEntity.statuses) {
    await runSequentially(workflowOfEntity.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (workflowOfEntity.transitions) {
    await runSequentially(workflowOfEntity.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }

  await conf.wfWorkflowOfEntityService.createIfNotExists(workflowOfEntity);
}

async function updateWfWorkflow(workflow) {
  await conf.wfWorkflowService.createIfNotExists(workflow);

  const defaultData = {
    workflow:    workflow.name,
    ownerModule: workflow.ownerModule,
  };

  if (workflow.statuses) {
    await runSequentially(workflow.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (workflow.transitions) {
    await runSequentially(workflow.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfStatus(workflowStatus) {
  await conf.wfStatusService.createIfNotExists(workflowStatus);

  const defaultData = {
    workflow:    workflowStatus.workflow,
    ownerModule: workflowStatus.ownerModule,
  };

  if (workflowStatus.transitions) {
    await runSequentially(workflowStatus.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfTransition(workflowTransition) {
  const defaultData = {
    workflow:    workflowTransition.workflow,
    ownerModule: workflowTransition.ownerModule,
  };

  if (typeof workflowTransition.from === 'object') {
    await updateWfStatus({ ...defaultData, ...workflowTransition.from });
    workflowTransition = { ...workflowTransition, from: workflowTransition.from.name };
  }

  if (typeof workflowTransition.to === 'object') {
    await updateWfStatus({ ...defaultData, ...workflowTransition.to });
    workflowTransition = { ...workflowTransition, to: workflowTransition.to.name };
  }

  await conf.wfTransitionService.createIfNotExists(workflowTransition);
}

async function getWorkflowsForEntity(entity, options) {
  conf.workflowsCache[entity] ||= {};
  const workflowsCache = conf.workflowsCache[entity];

  const language = options?.loc?.language;
  if (workflowsCache[language] === undefined) {
    workflowsCache[language] = {};
        
    const workflows = await conf.wfWorkflowOfEntityService.getForEntityName(
      entity,
      {
        include: { workflow: true },
        loc: options.loc,
      }
    );

    workflowsCache[language] = workflows;
  }

  return workflowsCache[language];
}

async function interfaceGridGet({ entity, context, grid }) {
  if (!entity) {
    return;
  }

  conf.fieldsCache[entity] ||= {};
  const fieldsCache = conf.fieldsCache[entity];

  const loc = context?.loc,
    language = loc?.language;
  if (fieldsCache[language] === undefined) {
    fieldsCache[language] = [];

    const workflows = await getWorkflowsForEntity(entity, { loc });
    for (const workflow of workflows) {
      fieldsCache[language].push(
        {
          isColumn:  workflow.showCurrentStatusInColumn,
          isDetail:  workflow.showCurrentStatusInDetail,
          name:      workflow.currentStatusName,
          label:     workflow.currentStatusTitle,
          type:      'text',
          className: 'framed',
        },
        {
          isColumn:  workflow.showAssigneeInColumn,
          isDetail:  workflow.showAssigneeInDetail,
          name:      workflow.assigneeName,
          label:     workflow.assigneeTitle,
          type:      'text',
        },
        {
          isColumn:  workflow.showWorkflowInColumn,
          isDetail:  workflow.showWorkflowInDetail,
          name:      workflow.workflowName,
          label:     workflow.workflowTitle,
          type:      'text',
        },
      );
    }
  }

  grid.fields ??= [];
  grid.fields.push(...fieldsCache[language]);
}

async function getted({ entity, result, options }) {
  if (!entity) {
    return result;
  }

  const workflows = await getWorkflowsForEntity(entity, options);
  if (!workflows.length) {
    return result;
  }

  const loc = options?.loc ?? defaultLoc;
  result = await result;
  for (const iRow in result) {
    let row = result[iRow];
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }

    for (const workflow of workflows) {
      const wfCase = await conf.wfCaseService.getSingleFor(
        {
          workflowId: workflow.id,
          entityId: row.id
        },
        {
          include: {
            //status:   true,
            //assignee: true,
          },
          skipNoRowsError: true,
          loc,
        },
      );

      if (wfCase) {
        if (workflow.currentStatusName) {
          row[workflow.currentStatusName] = wfCase?.CurrentStatus?.Status?.title;
        }

        if (workflow.assigneeName) {
          row[workflow.assigneeName] = wfCase?.CurrentStatus?.Assignee?.displayName;
        }
      } else {
        if (workflow.currentStatusName) {
          row[workflow.currentStatusName] = `<a href="#">${await loc._c('workflow', 'Create workflow case')}</a>`;
        }

        if (workflow.assigneeName) {
          row[workflow.assigneeName] = await loc._c('workflow', 'No workflow case');
        }
      }

      if (workflow.workflowName) {
        row[workflow.workflowName] = workflow.title;
      }
    }
  }

  return result;
}