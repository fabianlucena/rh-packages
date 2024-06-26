import { Service } from 'rf-service';

export class WfCaseService extends Service.Base {
  references = {
    workflow: 'wfWorkflowService',
    case:     'wfStatusService',
    assignee: 'userService',
  };
  defaultTranslationContext = 'workflow';
}