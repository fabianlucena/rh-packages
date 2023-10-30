import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledSharedTranslatable} from 'rf-service';

export class CompanyService extends ServiceIdUuidNameEnabledSharedTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Company;
    models = conf.global.models;
    shareObject = 'Company';
    shareService = conf.global.services.Share;
    references = {
        company: {
            service: conf.global.services.Company,
            otherName: 'name',
        },
        site: {
            service: conf.global.services.Site,
            otherName: 'name',
        },
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'company';

    async getListOptions(options) {
        if (options?.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
            }
        }

        return super.getListOptions(options);
    }
}