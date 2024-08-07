import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { CheckError } from 'rf-util';

export class BranchService extends Service.IdUuidNameEnabledOwnerModuleSharedTranslatable {
  references = {
    company: {
      attributes: ['uuid', 'name', 'title'],
    },
  };
  searchColumns = ['name', 'title', 'description'];
  eventBus = conf.global.eventBus;
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'description'];

  async validateForCreation(data) {
    if (!data.companyId) {
      throw new CheckError(loc => loc._c('branch', 'Company parameter is missing.'));
    }

    return super.validateForCreation(data);
  }

  async getListOptions(options) {
    if (options.where?.companyUuid) {
      throw new Error('options.where.companyUuid is deprecated in BranchService.');
    }

    return super.getListOptions(options);
  }

  async getForCompanyId(companyId, options) {
    return this.getList({ ...options, where: { companyId }});
  }

  async getIdForCompanyId(companyId, options) {
    const rows = await this.getForCompanyId(companyId, { ...options, attributes:['id'] });
    return rows.map(row => row.id);
  }
}