import { Service } from 'rf-service';

export class WfStatusIsFinalService extends Service.Base {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}