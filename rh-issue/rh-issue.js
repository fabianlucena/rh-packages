import {IssueStatusService} from './services/issue-status.js';
import {IssuePriorityService} from './services/issue-priority.js';
import {IssueWorkflowService} from './services/issue-workflow.js';
import {IssueTransitionService} from './services/issue-transition.js';
import {IssueCloseReasonService} from './services/issue-close-reason.js';
import {IssueTypeService} from './services/issue-type.js';
import {IssueService} from './services/issue.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

async function configure(global, options) {
    for (const k in options) {
        conf[k] = options[k];
    }
}

async function updateData(global) {
    const data = global?.data;
    const issueStatusService = IssueStatusService.singleton();
    const issuePriorityService = IssuePriorityService.singleton();
    const issueWorkflowService = IssueWorkflowService.singleton();
    const issueTransitionService = IssueTransitionService.singleton();
    const issueTypeService = IssueTypeService.singleton();
    const issueCloseReasonService = IssueCloseReasonService.singleton();
    const issueService = IssueService.singleton();

    await runSequentially(data?.issuesStatuses,     async data => await issueStatusService.createIfNotExists(data));
    await runSequentially(data?.issuesPriorities,   async data => await issuePriorityService.createIfNotExists(data));
    await runSequentially(data?.issuesWorkflows,    async data => await issueWorkflowService.createIfNotExists(data));
    await runSequentially(data?.issuesTransitions,  async data => await issueTransitionService.createIfNotExists(data));
    await runSequentially(data?.issuesTypes,        async data => await issueTypeService.createIfNotExists(data));
    await runSequentially(data?.issuesCloseReasons, async data => await issueCloseReasonService.createIfNotExists(data));
    await runSequentially(data?.issues,             async data => await issueService.createIfNotExists(data));
}