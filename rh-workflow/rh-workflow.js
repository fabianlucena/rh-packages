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
conf.columnsCache = {};
conf.detailsCache = {};

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
  conf.wfWorkflowTypeService =  dependency.get('wfWorkflowTypeService');
  conf.wfStatusService =        dependency.get('wfStatusService');
  conf.wfTransitionService =    dependency.get('wfTransitionService');
  conf.wfCaseService =          dependency.get('wfCaseService');
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.workflowsTypes,       async data => updateWfWorkflowType(data));
  await runSequentially(data?.workflowsStatuses,    async data => updateWfStatus(data));
  await runSequentially(data?.workflowsTransitions, async data => updateWfTransition(data));
  await runSequentially(data?.workflows,            async data => updateWfWorkflow(data));
}

async function updateWfWorkflow(workflow) {
  if (workflow.type && !workflow.workflowType) {
    workflow = { ...workflow, workflowType: workflow.type, type: undefined };
  }

  const defaultData = { ownerModule: workflow.ownerModule };
    
  if (typeof workflow.workflowType === 'object') {
    await updateWfWorkflowType({ ...defaultData, ...workflow.workflowType });
    workflow = { ...workflow, workflowType: workflow.workflowType.name };
  }

  defaultData.workflowType = workflow.workflowType;

  if (workflow.statuses) {
    await runSequentially(workflow.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (workflow.transitions) {
    await runSequentially(workflow.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }

  await conf.wfWorkflowService.createIfNotExists(workflow);
}

async function updateWfWorkflowType(workflowType) {
  await conf.wfWorkflowTypeService.createIfNotExists(workflowType);

  const defaultData = {
    workflowType: workflowType.name,
    ownerModule: workflowType.ownerModule,
  };

  if (workflowType.statuses) {
    await runSequentially(workflowType.statuses, async data => updateWfStatus({ ...defaultData, ...data }));
  }

  if (workflowType.transitions) {
    await runSequentially(workflowType.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfStatus(workflowStatus) {
  await conf.wfStatusService.createIfNotExists(workflowStatus);

  const defaultData = {
    workflowType: workflowStatus.workflowType ?? workflowStatus.type,
    ownerModule: workflowStatus.ownerModule,
  };

  if (workflowStatus.transitions) {
    await runSequentially(workflowStatus.transitions, async data => updateWfTransition({ ...defaultData, ...data }));
  }
}

async function updateWfTransition(workflowTransition) {
  const defaultData = {
    workflowType: workflowTransition.workflowType ?? workflowTransition.type,
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

async function interfaceGridGet(grid, options) {
  const entity = options?.entity;
  if (!entity) {
    return;
  }

  conf.columnsCache[entity] ||= {};
  conf.detailsCache[entity] ||= {};

  const columnsCache = conf.columnsCache[entity];
  const detailsCache = conf.detailsCache[entity];

  const loc = options?.loc;
  const language = loc?.language;
  if (columnsCache[language] === undefined) {
    columnsCache[language] = [];
    detailsCache[language] = [];

    const workflows = await getWorkflowsForEntity(entity, { loc });
    const columns = [];
    const details = [];
    for (const workflow of workflows) {
      const fields = [
        {
          isColumn: workflow.showCurrentStatusInColumn,
          isDetail: workflow.showCurrentStatusInDetail,
          name: workflow.currentStatusName,
          label: workflow.currentStatusTitle,
          type: 'text',
          className: 'framed',
        },
        {
          isColumn: workflow.showAssigneeInColumn,
          isDetail: workflow.showAssigneeInDetail,
          name: workflow.assigneeName,
          label: workflow.assigneeTitle,
          type: 'text',
        },
        {
          isColumn: workflow.showWorkflowInColumn,
          isDetail: workflow.showWorkflowInDetail,
          name: workflow.workflowName,
          label: workflow.workflowTitle,
          type: 'text',
        },
      ];

      columns.push(...fields.filter(f => f.isColumn));
      details.push(...fields.filter(f => f.isDetail));
    }

    columnsCache[language].push(...columns);
    detailsCache[language].push(...details);
  }

  grid.columns ??= [];
  grid.details ??= [];

  grid.columns.push(...columnsCache[language]);
  grid.details.push(...detailsCache[language]);
}

async function getted(entity, result, options) {
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
            Status: true,
            Assignee: true,
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