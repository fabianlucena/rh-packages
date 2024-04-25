import { ServiceBase } from 'rf-service';

export class WfCaseService extends ServiceBase {
  references = {
    workflow: 'wfWorkflowService',
    case:     'wfStatusService',
    assignee: 'userService',
  };
  defaultTranslationContext = 'workflow';
}