import { Service } from 'rf-service';

export class WfCaseLogService extends Service.IdUuid {
  references = {
    case: 'wfCaseService',
    status: 'wfStatusService',
    assignee: 'userService',
    operator: 'userService',
  };
  defaultTranslationContext = 'workflow';
}