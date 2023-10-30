import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {addEnabledFilter, includeCollaborators} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class CompanyService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Company;
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

    async validateForCreation(data) {
        if (data.id) {
            throw new CheckError(loc._cf('company', 'ID parameter is forbidden for creation.'));
        }

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('company', 'Name'));
        checkParameterStringNotNullOrEmpty(data.title, loc._cf('company', 'Title'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {skipNoRowsError: true})) {
            throw new ConflictError(loc._cf('company', 'Exists another test scenary with that name.'));
        }

        if (!data.owner && !data.ownerId) {
            throw new CheckError(loc._cf('company', 'No owner specified.'));
        }

        return true;
    }

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];
            }
        }

        if (options.includeOwner) {
            includeCollaborators(options, 'Company', conf.global.models, {filterType: 'owner'});
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
}