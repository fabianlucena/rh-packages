import { WfStatusService } from './wf-status.js';
import {conf} from '../conf.js';
import {ServiceBase} from 'rf-service';

export class WfStatusIsInitialService extends ServiceBase {
    sequelize = conf.global.sequelize;
    model = conf.global.models.WfStatusIsInitial;
    references = {
        status: WfStatusService.singleton(),
    };
    defaultTranslationContext = 'workflow';
}