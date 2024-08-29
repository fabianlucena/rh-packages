import { conf } from '../conf.js';
import { Service, OptionalService, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { ConflictError } from 'http-util';
import dependency from 'rf-dependency';

// TODO: Add Shared, and make it work when updating DB
export class ProjectService extends Service.IdUuidEnableNameUniqueTitleTranslatable {
  references = {
    company: OptionalService({
      attribute: ['uuid', 'name', 'title'],
    }),
    ownerModule: true,
  };
  eventBus = conf.global.eventBus;
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];

  init() {
    super.init();

    this.companyService = dependency.get('companyService', null);
  }

  async validateForCreation(data) {
    if (this.companyService) {
      if (!data?.companyId) {
        throw new CheckError(loc => loc._c('project', 'Company parameter is missing.'));
      }
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const where = { name };
    if (this.companyService) {
      where.companyId = data.companyId;
    }

    const rows = await this.getFor(where, { skipNoRowsError: true });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('project', 'Exists another project with that name in this company.'));
    }
  }

  async checkTitleForConflict(title, data, where) {
    const whereOptions = { title };

    if (this.companyService) {
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
      throw new ConflictError(loc => loc._c('project', 'Exists another project with that title in this company.'));
    }
  }

  async getListOptions(options) {
    if (options.where?.companyUuid) {
      throw new Error('Where option companyUuid format is deprecated.');
    }

    return super.getListOptions(options);
  }
}