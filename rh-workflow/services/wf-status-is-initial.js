import { ServiceBase } from 'rf-service';

export class WfStatusIsInitialService extends ServiceBase {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}