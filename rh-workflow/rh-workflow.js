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
  global.eventBus?.$on('getted', getted);
  global.eventBus?.$on('created', created);
}

let 
  //modelEntityNameService,
  wfWorkflowOfEntityService,
  wfWorkflowService,
  wfStatusService,
  wfTransitionService,
  wfCaseService,
  wfBranchService;

async function init() {
  //modelEntityNameService =    dependency.get('modelEntityNameService');
  wfWorkflowOfEntityService = dependency.get('wfWorkflowOfEntityService');
  wfWorkflowService =         dependency.get('wfWorkflowService');
  wfStatusService =           dependency.get('wfStatusService');
  wfTransitionService =       dependency.get('wfTransitionService');
  wfCaseService =             dependency.get('wfCaseService');
  wfBranchService =           dependency.get('wfBranchService');
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

  await wfWorkflowOfEntityService.createIfNotExists(workflowOfEntity);
}

async function updateWfWorkflow(workflow) {
  await wfWorkflowService.createIfNotExists(workflow);

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
  await wfStatusService.createIfNotExists(workflowStatus);

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

  await wfTransitionService.createIfNotExists(workflowTransition);
}

async function getWorkflowsForEntity(entity, options) {
  conf.workflowsCache[entity] ||= {};
  const workflowsCache = conf.workflowsCache[entity];

  const language = options?.loc?.language;
  if (workflowsCache[language] === undefined) {
    workflowsCache[language] = {};
        
    const workflows = await wfWorkflowOfEntityService.getForEntityName(
      entity,
      {
        include: { workflow: true },
        loc: options?.loc ?? defaultLoc,
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
          name:      workflow.workflowName,
          label:     workflow.workflowTitle,
          type:      'text',
          isColumn:  workflow.showWorkflowInColumn,
          isDetail:  workflow.showWorkflowInDetail,
        },
        {
          name:      workflow.currentStatusName,
          label:     workflow.currentStatusTitle,
          type:      'list',
          isColumn:  workflow.showCurrentStatusInColumn,
          isDetail:  workflow.showCurrentStatusInDetail,
        },
        {
          name:      workflow.assigneeName,
          label:     workflow.assigneeTitle,
          type:      'list',
          isColumn:  workflow.showAssigneeInColumn,
          isDetail:  workflow.showAssigneeInDetail,
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
    if (!row.uuid) {
      continue;
    }

    for (const workflow of workflows) {
      if (workflow.workflowName) {
        row[workflow.workflowName] = workflow.title;
      }

      let wfCase = await wfCaseService.getForWorkflowIdAndEnrityUuid(
        workflow.id,
        row.uuid,
        { loc },
      );

      if (!wfCase) {
        await wfCaseService.createForWorkflowIdAndEnrityUuid(workflow.id, row.uuid);
        wfCase = await wfCaseService.getForWorkflowIdAndEnrityUuid(
          workflow.id,
          row.uuid,
          { loc },
        );
      }

      if (wfCase) {
        if (workflow.currentStatusName) {
          let branches = wfCase.branches;
          if (!branches?.length) {
            await wfBranchService.createForWorkflowIdAndCaseId(workflow.id, wfCase.id);
            branches = await wfBranchService.getForCaseId(wfCase.id);
          }

          if (branches?.length) {
            row[workflow.currentStatusName] = await Promise.all(branches
              .map(async b => {
                if (!b.status) {
                  return;
                }

                return `${b.status.title}: ${b.assignee?.displayName ?? await loc._c(workflow.transitionContext || 'workflow', '{Unasigned}')}`;
              })
              .filter(i => !!i)
            );
          }

          if (workflow.assigneeName && branches?.length) {
            row[workflow.assigneeName] = await Promise.all(branches
              .map(async b => {
                if (!b.status) {
                  return;
                }

                return `${b.assignee?.displayName ?? await loc._c(workflow.transitionContext || 'workflow', '{Unasigned}')} (${b.status.title})`;
              })
              .filter(i => !!i)
            );
          }
        }
      }

      if (!row[workflow.currentStatusName]) {
        row[workflow.currentStatusName] = [await loc._c('workflow', 'Error in workflow')];
      }

      if (!row[workflow.assigneeName]) {
        row[workflow.assigneeName] = [await loc._c('workflow', 'Error in workflow')];
      }
    }
  }

  return result;
}

async function created({ entity, rows, options }) {
  if (!entity) {
    return;
  }

  const workflows = await getWorkflowsForEntity(entity, options);
  if (!workflows.length) {
    return;
  }

  const loc = options?.loc ?? defaultLoc;

  for (const iRow in rows) {
    let row = rows[iRow];
    if (!row.uuid) {
      continue;
    }

    for (const workflow of workflows) {
      let wfCase = await wfCaseService.getForWorkflowIdAndEnrityUuid(
        workflow.id,
        row.uuid,
        { loc },
      );
      
      if (!wfCase) {
        wfCase = await wfCaseService.createForWorkflowIdAndEnrityUuid(workflow.id, row.uuid);
        await wfBranchService.createForWorkflowIdAndCaseId(workflow.id, wfCase.id);
      }
    }
  }
}