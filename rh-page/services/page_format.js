import { conf } from '../conf.js';
import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';

export class PageFormatService extends ServiceIdUuidNameEnabledTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.PageFormat;
  defaultTranslationContext = 'pageFormat';
}