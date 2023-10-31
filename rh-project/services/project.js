import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledSharedTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {CheckError} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class ProjectService extends ServiceIdUuidNameEnabledSharedTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Project;
    shareObject = 'Project';
    shareService = conf.global.services.Share.singleton();
    references = {
        company: conf.global.services.Company,
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'project';
    eventBus = conf.global.eventBus;
    eventName = 'project';

    async validateForCreation(data) {
        if (!data?.companyId) {
            throw new CheckError(loc._cf('project', 'Company parameter is missing.'));
        }

        return super.validateForCreation(data);
    }

    async checkNameForConflict(name, data) {
        const rows = await this.getFor({name, companyId: data.companyId}, {skipNoRowsError: true});
        if (rows?.length) {
            throw new ConflictError(loc._cf('project', 'Exists another project with that name in this company.'));
        }
    }

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
        }

        if (options.includeCompany || options.where?.companyUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.companyUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.companyUuid;
                delete options.where.companyUuid;
            }

            const attributes = options.includeCompany?
                ['uuid', 'name', 'title']:
                [];

            completeIncludeOptions(
                options,
                'Company',
                {
                    model: conf.global.models.Company,
                    attributes,
                    where,
                }
            );

            delete options.includeCompany;
        }

        return super.getListOptions(options);
    }

    async getForCompanyId(companyId, options) {
        return this.getList({...options, where: {companyId}});
    }

    async getIdForCompanyId(companyId, options) {
        const rows = await this.getForCompanyId(companyId, {...options, attributes:['id']});
        return rows.map(row => row.id);
    }
}