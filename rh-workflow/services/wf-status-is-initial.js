import { Service } from 'rf-service';

export class WfStatusIsInitialService extends Service.Translatable {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}