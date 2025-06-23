import { Service } from 'rf-service';

export class WfStatusIsInitialService extends Service.Translatable {
  references = {
    workflow:  'wfWorkflow',
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}