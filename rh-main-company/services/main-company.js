import { conf } from '../conf.js';

export class MainCompanyService {
  companySiteService = null;
  companyService = null;
  siteService = null;

  static singleton() {
    if (!this.singletonInstance) {
      this.singletonInstance = new this();
    }

    return this.singletonInstance;
  }

  constructor() {
    this.companySiteService = conf.global.services.CompanySite.singleton();
    this.companyService = conf.global.services.Company.singleton();
    this.siteService = conf.global.services.Site.singleton();
  }

  async create(options) {
    return this.companySiteService.create(options);
  }

  async getListAndCount(options) {
    const result = await this.companySiteService.getListAndCount(options);
        
    result.rows = result.rows.map(row => {
      const result = row.Company;
      if (row.share?.length) {
        result.ownerDisplayName = row.share[0]?.User?.displayName;
      }
            
      return result;
    });

    return result;
  }

  async getSingleSiteIdForId(id, options) {
    const companySite = await this.getSingleForId(id, options);
    return companySite.siteId;
  }

  async deleteForUuid(uuid, options) {
    const companyId = await this.getSingleIdForUuid(uuid);
    const siteId = await this.getSingleSiteIdForId(companyId);

    await this.companySiteService.deleteFor({ companyId }, options);
    await this.companyService.deleteForId(companyId);
    return this.siteService.deleteForId(siteId);
  }

  async enableForUuid(uuid, options) {
    let id = await this.getSingleIdForUuid(uuid);
    this.companyService.update({ isEnabled: true }, { ...options, where: { ...options?.where, id }});

    id = await this.getSingleSiteIdForId(id);
    return this.siteService.update({ isEnabled: true }, { ...options, where: { ...options?.where, id }});
  }
    
  async disableForUuid(uuid, options) {
    let id = await this.getSingleIdForUuid(uuid);
    this.companyService.update({ isEnabled: false }, { ...options, where: { ...options?.where, id }});

    id = await this.getSingleSiteIdForId(id);
    return this.siteService.update({ isEnabled: true }, { ...options, where: { ...options?.where, id }});
  }

  async updateForUuid(data, uuid, options) {
    const companyId = await this.getSingleIdForUuid(uuid);
    const siteId = await this.getSingleSiteIdForId(companyId);

    const sanitizedData = { ...data, uuid: undefined };

    await this.companyService.updateForId(sanitizedData, companyId, options);
    return this.siteService.updateForId(sanitizedData, siteId, options);
  }

  async createIfNotExists(data, options) {
    const row = await this.getForName(data.name, { skipNoRowsError: true, ...options });
    if (row) {
      return row;
    }

    return this.create(data);
  }
}