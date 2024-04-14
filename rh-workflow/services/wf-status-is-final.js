import { WfStatusService } from './wf-status.js';
import { conf } from '../conf.js';
import { ServiceBase } from 'rf-service';

export class WfStatusIsFinalService extends ServiceBase {
  sequelize = conf.global.sequelize;
  model = conf.global.models.WfStatusIsFinal;
  references = {
    status: WfStatusService.singleton(),
  };
  defaultTranslationContext = 'workflow';
}