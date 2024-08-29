import { Service } from 'rf-service';

export class WfStatusIsFinalService extends Service.Translatable {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}