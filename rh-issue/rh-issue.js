import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import dependency from 'rf-dependency';

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
  const issuePriorityService =     dependency.get('issuePriorityService');
  const issueTypeService =         dependency.get('issueTypeService');
  const issueCloseReasonService =  dependency.get('issueCloseReasonService');
  const issueRelationshipService = dependency.get('issueRelationshipService');
  const issueService =             dependency.get('issueService');

  await runSequentially(data?.issuePriorities,    async data => await issuePriorityService.    createIfNotExists(data));
  await runSequentially(data?.issueTypes,         async data => await issueTypeService.        createIfNotExists(data));
  await runSequentially(data?.issueCloseReasons,  async data => await issueCloseReasonService. createIfNotExists(data));
  await runSequentially(data?.issueRelationships, async data => await issueRelationshipService.createIfNotExists(data));
  await runSequentially(data?.issues,             async data => await issueService.            createIfNotExists(data));
}