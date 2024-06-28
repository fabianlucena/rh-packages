import { IssuePriorityService } from './services/issue-priority.js';
import { IssueCloseReasonService } from './services/issue-close-reason.js';
import { IssueTypeService } from './services/issue-type.js';
import { IssueService } from './services/issue.js';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';

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
  const issuePriorityService =    IssuePriorityService.   singleton();
  const issueTypeService =        IssueTypeService.       singleton();
  const issueCloseReasonService = IssueCloseReasonService.singleton();
  const issueService =            IssueService.           singleton();

  await runSequentially(data?.issuePriorities,   async data => await issuePriorityService.   createIfNotExists(data));
  await runSequentially(data?.issueTypes,        async data => await issueTypeService.       createIfNotExists(data));
  await runSequentially(data?.issueCloseReasons, async data => await issueCloseReasonService.createIfNotExists(data));
  await runSequentially(data?.issues,            async data => await issueService.           createIfNotExists(data));
}