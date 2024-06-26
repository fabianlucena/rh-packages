import { Service } from 'rf-service';

export class WfStatusIsInitialService extends Service.Base {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}