import { ServiceBase } from 'rf-service';

export class WfStatusIsFinalService extends ServiceBase {
  references = {
    status: 'wfStatusService',
  };
  defaultTranslationContext = 'workflow';
}