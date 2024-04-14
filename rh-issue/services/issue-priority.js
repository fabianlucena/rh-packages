import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';

export class IssuePriorityService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.IssuePriority;
  defaultTranslationContext = 'issue';

  async getListOptions(options) {
    options ??= {};

    if (options.view) {
      if (!options.attributes) {
        options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
      }
    }

    return super.getListOptions(options);
  }
}