import dependency from 'rf-dependency';
import { Service } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class CompanySiteService extends Service.OwnerModule {
  references = {
    company: { otherName: 'name' },
    site:    { otherName: 'name' },
  };

  init() {
    super.init();

    this.companyService = dependency.get('companyService');
    this.siteService = dependency.get('siteService');
  }

  /**
   * Creates a new user CompanySite row into DB.
   * @param {{
   *  company: string,
   *  companyId: int,
   *  site: string,
   *  siteId: int,
   * }} data - data for the new CompanySite.
   * @returns {Promise[CompanySite]}
   */
  async create(data, options) {
    data = await this.completeReferences(data, options);

    let company;
    if (!data.companyId) {
      if (data.name && data.title) {
        const [createdCompany] = await this.companyService.findOrCreate(data);
        company = createdCompany;
        data.companyId = company.id;
      }

      await checkDataForMissingProperties(data, 'CompanySiteService', 'companyId');
    }

    if (!data.siteId) {
      let siteData;
      if (data.name && data.title) {
        siteData = { ...data };
        if (siteData.siteDescription) {
          siteData.description = siteData.siteDescription;
        }
      } else {
        if (!company) {
          company = await this.companyServices.get(data.companyId);
        }

        siteData.name = company.name;
        siteData.title = company.title;
        siteData.ownerModuleId = company.ownerModuleId;
      }

      const [site] = await this.siteService.findOrCreate(siteData);
      data.siteId = site.id;

      await checkDataForMissingProperties(data, 'CompanySiteService', 'siteId');
    }

    return super.create(data);
  }

  /**
   * Creates a new user CompanySite row into DB if not exists.
   * @param {data} data - data for the new CompanySite @see create.
   * @returns {Promise[CompanySite]}
   */
  async createIfNotExists(data, options) {
    data = await this.completeReferences(data, options);
        
    const rows = await this.getList({
      ...options,
      where:{
        ...options?.where,
        companyId: data.companyId ?? options?.where?.companyId ?? null,
        siteId: data.siteId ?? options?.where?.siteId ?? null
      }
    });

    let item;
    if (rows?.length) {
      item = rows[0];
    } else {
      item = await this.create(data);
    }

    return item;
  }

  async getForSiteId(siteId, options) {
    return this.getSingleFor({ siteId }, options);
  }

  async getCompanyIdForSiteId(siteId, options) {
    return (await this.getForSiteId(siteId, options))?.companyId;
  }
}