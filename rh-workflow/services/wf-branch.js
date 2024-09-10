import { Service } from 'rf-service';

export class WfBranchService extends Service.Translatable {
  references = {
    case:     'wfCase',
    status:   'wfStatus',
    assignee: 'user',
  };
  defaultTranslationContext = 'workflow';
}