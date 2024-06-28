import { conf } from '../conf.js';
import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';

export class ResourceTypeService extends ServiceIdUuidNameEnabledTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.ResourceType;
  defaultTranslationContext = 'resourceType';
}