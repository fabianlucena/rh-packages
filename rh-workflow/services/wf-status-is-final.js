import { Service } from 'rf-service';

export class WfStatusIsFinalService extends Service.Translatable {
  references = {
    workflow: 'wfWorkflow',
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}