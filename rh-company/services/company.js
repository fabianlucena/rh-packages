import { Service } from 'rf-service';
import { conf } from '../conf.js';

export class CompanyService extends Service.IdUuidEnableNameUniqueTitleSharedTranslatable {
  eventBus = conf.global.eventBus;
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
}