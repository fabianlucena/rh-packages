import { Service } from 'rf-service';

export class WfCaseService extends Service.Base {
  references = {
    workflow: 'wfWorkflowOfEntityService',
    //status:   'wfStatusService',
    //assignee: 'userService',
  };
  defaultTranslationContext = 'workflow';
}