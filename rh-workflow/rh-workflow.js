import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import dependency from 'rf-dependency';

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
  conf.modelEntityNameService = dependency.get('modelEntityNameService');
  conf.wfWorkflowService =      dependency.get('wfWorkflowService');
  conf.wfTypeService =          dependency.get('wfTypeService');
  conf.wfStatusService =        dependency.get('wfStatusService');
  conf.wfTransitionService =    dependency.get('wfTransitionService');
  conf.wfCaseService =          dependency.get('wfCaseService');
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.workflowsTypes,       async data => updateWfType(data));
  await runSequentially(data?.workflowsStatuses,    async data => updateWfStatus(data));
  await runSequentially(data?.workflowsTransitions, async data => updateWfTransition(data));
  await runSequentially(data?.workflows,            async data => updateWfWorkflow(data));
}

async function updateWfWorkflow(workflow) {
  const defaultData = { ownerModule: workflow.ownerModule };
    
  if (typeof workflow.type === 'object') {
    await updateWfType({ ...defaultData, ...workflow.type });
    workflow = { ...workflow, type: workflow.type.name };
  }

  defaultData.type = workflow.type;

  if (workflow.statuses) {
    await runSequentially(workflow.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (workflow.transitions) {
    await runSequentially(workflow.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }

  await conf.wfWorkflowService.createIfNotExists(workflow);
}

async function updateWfType(type) {
  await conf.wfTypeService.createIfNotExists(type);

  const defaultData = {
    type:        type.name,
    ownerModule: type.ownerModule,
  };

  if (type.statuses) {
    await runSequentially(type.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (type.transitions) {
    await runSequentially(type.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfStatus(workflowStatus) {
  await conf.wfStatusService.createIfNotExists(workflowStatus);

  const defaultData = {
    type:        workflowStatus.type,
    ownerModule: workflowStatus.ownerModule,
  };

  if (workflowStatus.transitions) {
    await runSequentially(workflowStatus.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfTransition(workflowTransition) {
  const defaultData = {
    type:        workflowTransition.type,
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
        
    const workflows = await conf.wfWorkflowService.getForEntityName(
      entity,
      {
        include: { type: true },
        loc: options.loc,
      }
    );

    workflowsCache[language] = workflows;
  }

  return workflowsCache[language];
}

async function interfaceGridGet({ grid, options }) {
  const entity = options?.entity;
  if (!entity) {
    return;
  }

  conf.fieldsCache[entity] ||= {};
  const fieldsCache = conf.fieldsCache[entity];

  const loc = options?.loc;
  const language = loc?.language;
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
          loc: options.loc,
        },
      );

      if (wfCase) {
        if (workflow.currentStatusName) {
          row[workflow.currentStatusName] = wfCase?.CurrentStatus?.Status?.title;
        }

        if (workflow.assigneeName) {
          row[workflow.assigneeName] = wfCase?.CurrentStatus?.Assignee?.displayName;
        }
      }

      if (workflow.workflowName) {
        row[workflow.workflowName] = workflow.title;
      }
    }
  }

  return result;
}