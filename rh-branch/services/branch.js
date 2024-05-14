import { conf } from '../conf.js';
import { ServiceIdUuidNameEnabledOwnerModuleSharedTranslatable } from 'rf-service';
import { CheckError } from 'rf-util';
import { loc } from 'rf-locale';

export class BranchService extends ServiceIdUuidNameEnabledOwnerModuleSharedTranslatable {
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
      throw new CheckError(loc._cf('branch', 'Company parameter is missing.'));
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