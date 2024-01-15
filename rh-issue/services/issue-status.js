import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledTranslatable} from 'rf-service';

export class IssueStatusService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.IssueStatus;
    defaultTranslationContext = 'issue';

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'isClosed', 'description'];
            }
        }

        return super.getListOptions(options);
    }
}