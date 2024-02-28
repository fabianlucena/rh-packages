import {WfWorkflowService} from './services/wf-workflow.js';
import {WfWorkflowTypeService} from './services/wf-workflow-type.js';
import {WfStatusService} from './services/wf-status.js';
import {WfTransitionService} from './services/wf-transition.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

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
    /*global.eventBus?.$on('interface.form.get', interfaceFormGet);
    global.eventBus?.$on('getted', getted);
    global.eventBus?.$on('created', created);
    global.eventBus?.$on('updated', updated);
    global.eventBus?.$on('deleting', deleting);
    global.eventBus?.$on('deleted', deleted);
    global.eventBus?.$on('sanitized', sanitized);*/
}

async function init() {
    conf.wfWorkflowService =     WfWorkflowService.    singleton();
    conf.wfWorkflowTypeService = WfWorkflowTypeService.singleton();
    conf.wfStatusService =       WfStatusService.      singleton();
    conf.wfTransitionService =   WfTransitionService.  singleton();
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
        workflow = {...workflow, workflowType: workflow.type, type: undefined};
    }

    const defaultData = {ownerModule: workflow.ownerModule};
    
    if (typeof workflow.workflowType === 'object') {
        await updateWfWorkflowType({...defaultData, ...workflow.workflowType});
        workflow = {...workflow, workflowType: workflow.workflowType.name};
    }

    defaultData.workflowType = workflow.workflowType;

    if (workflow.statuses) {
        await runSequentially(workflow.statuses, async data => updateWfStatus({...defaultData, ...data}));
    }

    if (workflow.transitions) {
        await runSequentially(workflow.transitions, async data => updateWfTransition({...defaultData, ...data}));
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
        await runSequentially(workflowType.statuses, async data => updateWfStatus({...defaultData, ...data}));
    }

    if (workflowType.transitions) {
        await runSequentially(workflowType.transitions, async data => updateWfTransition({...defaultData, ...data}));
    }
}

async function updateWfStatus(workflowStatus) {
    await conf.wfStatusService.createIfNotExists(workflowStatus);

    const defaultData = {
        workflowType: workflowStatus.workflowType ?? workflowStatus.type,
        ownerModule: workflowStatus.ownerModule,
    };

    if (workflowStatus.transitions) {
        await runSequentially(workflowStatus.transitions, async data => updateWfTransition({...defaultData, ...data}));
    }
}

async function updateWfTransition(workflowTransition) {
    const defaultData = {
        workflowType: workflowTransition.workflowType ?? workflowTransition.type,
        ownerModule: workflowTransition.ownerModule,
    };

    if (typeof workflowTransition.from === 'object') {
        await updateWfStatus({...defaultData, ...workflowTransition.from});
        workflowTransition = {...workflowTransition, from: workflowTransition.from.name};
    }

    if (typeof workflowTransition.to === 'object') {
        await updateWfStatus({...defaultData, ...workflowTransition.to});
        workflowTransition = {...workflowTransition, to: workflowTransition.to.name};
    }

    await conf.wfTransitionService.createIfNotExists(workflowTransition);
}

async function getWorkflowsForEntity(entity, options) {
    conf.workflowsCache[entity] ||= {};
    const workflowsCache = conf.workflowsCache[entity];

    const language = options?.loc?.language;
    if (workflowsCache[language] === undefined) {
        workflowsCache[language] = {};
        
        const workflowTypes = await conf.wfWorkflowService.getForEntityName(
            entity,
            {
                raw: true,
                nest: true,
                loc: options?.loc,
            }
        );

        workflowsCache[language] = workflowTypes;
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
    const language = options?.loc?.language;
    if (columnsCache[language] === undefined) {
        columnsCache[language] = [];
        detailsCache[language] = [];

        const workflows = await getWorkflowsForEntity(entity, options);
        const columns = [];
        const details = [];
        for (const workflow of workflows) {
            if (!workflow.isColumn && !workflow.isDetail) {
                continue;
            }

            const field = {
                name: workflow.name,
                label: workflow.title,
                type: 'list',
                className: 'hide-marker',
                items: {
                    className: 'framed',
                },
                properties: [
                    {
                        name: 'workflow',
                    },
                    {
                        name: 'createdAt',
                        type: 'dateTime',
                        label: await loc._c('workflow', 'Date'),
                        format: '%x %R',
                        className: 'small',
                    },
                    {
                        name: 'User.displayName',
                        label: await loc._c('workflow', 'User'),
                        className: 'framed detail small',
                    },
                ],
            };

            if (workflow.isColumn) {
                columns.push(field);
            }
            
            if (workflow.isDetail) {
                details.push(field);
            }
        }

        columnsCache[language].push(...columns);
        detailsCache[language].push(...details);
    }

    grid.columns ??= [];
    grid.details ??= [];

    grid.columns.push(...columnsCache[language]);
    grid.details.push(...detailsCache[language]);
}