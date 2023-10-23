import {conf} from '../conf.js';
import {ServiceIdUuidNameSharedEnableTranslatable} from 'rf-service';
import {addEnabledFilter, includeCollaborators, completeIncludeOptions} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class BranchService extends ServiceIdUuidNameSharedEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Branch;
    shareObject = 'Branch';
    shareService = conf.global.services.Share;
    references = {
        company: conf.global.services.Company,
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'branch';
    eventBus = conf.global.eventBus;
    eventName = 'branch';

    async validateForCreation(data) {
        if (data.id) {
            throw new CheckError(loc._cf('branch', 'ID parameter is forbidden for creation.'));
        }

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('branch', 'Name'));
        checkParameterStringNotNullOrEmpty(data.title, loc._cf('branch', 'Title'));

        if (!data.companyId) {
            throw new CheckError(loc._cf('branch', 'Company parameter is missing.'));
        }

        checkValidUuidOrNull(data.uuid);

        const rows = await this.getFor({name: data.name, companyId: data.companyId}, {skipNoRowsError: true});
        if (rows?.length) {
            throw new ConflictError(loc._cf('branch', 'Exists another branch with that name in this company.'));
        }

        return true;
    }

    async getListOptions(options) {
        if (!options) {
            options = {};
        }

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

        if (options.includeOwner) {
            includeCollaborators(options, 'Branch', conf.global.models, {filterType: 'owner'});
            delete options.includeOwner;
        }

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
        }

        return options;
    }

    async getForCompanyId(companyId, options) {
        return this.getList({...options, where: {companyId}});
    }

    async getIdForCompanyId(companyId, options) {
        const rows = await this.getForCompanyId(companyId, {...options, attributes:['id']});
        return rows.map(row => row.id);
    }
}