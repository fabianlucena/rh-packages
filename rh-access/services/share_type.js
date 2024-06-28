import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleTranslatable } from 'rf-service';

export class ShareTypeService extends ServiceIdUuidNameTitleTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.ShareType;
  defaultTranslationContext = 'shareType';
}