import { conf } from '../conf.js';
import { Service, OptionalService, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { loc } from 'rf-locale';
import { _ConflictError } from 'http-util';

export class ProjectService extends Service.IdUuidEnableNameUniqueTitleSharedTranslatable {
  references = {
    company: OptionalService({
      attribute: ['uuid', 'name', 'title'],
    }),
    ownerModule: true,
  };
  eventBus = conf.global.eventBus;
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];

  async validateForCreation(data) {
    if (conf.global.models.Company) {
      if (!data?.companyId) {
        throw new CheckError(loc._cf('project', 'Company parameter is missing.'));
      }
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const where = { name };
    if (conf.global.models.Company) {
      where.companyId = data.companyId;
    }

    const rows = await this.getFor(where, { skipNoRowsError: true });
    if (rows?.length) {
      throw new _ConflictError(loc._cf('project', 'Exists another project with that name in this company.'));
    }
  }

  async checkTitleForConflict(title, data, where) {
    const whereOptions = { title };

    if (conf.global.models.Company) {
      const companyId = where?.companyId ?? data?.companyId;
      if (companyId) {
        whereOptions.companyId = companyId;
      }
    }

    if (where?.uuid) {
      whereOptions.uuid = { [Op.ne]: where.uuid };
    }

    const rows = await this.getFor(whereOptions, { limit: 1 });
    if (rows?.length) {
      throw new _ConflictError(loc._cf('project', 'Exists another project with that title in this company.'));
    }
  }

  async getListOptions(options) {
    if (options.where?.companyUuid) {
      throw new Error('Where option companyUuid format is deprecated.');
    }

    return super.getListOptions(options);
  }
}