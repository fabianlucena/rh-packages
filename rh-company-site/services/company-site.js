import dependency from 'rf-dependency';
import { conf } from '../conf.js';
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
  async create(data) {
    await this.completeReferences(data);

    let company;
    if (!data.companyId) {
      if (data.name && data.title) {
        company = await this.companyService.createIfNotExists(data);
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

      const site = await this.siteService.createIfNotExists(siteData);
      data.siteId = site.id;

      await checkDataForMissingProperties(data, 'CompanySiteService', 'siteId');
    }

    super.create(data);
  }

  /**
   * Creates a new user CompanySite row into DB if not exists.
   * @param {data} data - data for the new CompanySite @see create.
   * @returns {Promise[CompanySite]}
   */
  async createIfNotExists(data, options) {
    await this.completeReferences(data);
        
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

    if (data.users) {
      const userSiteRoleService = conf.global.services.UserSiteRole.singleton();
      const siteId = item.siteId;
      for (const userRole of data.users) {
        await userSiteRoleService.createIfNotExists({ ...userRole, siteId, owner: data.owner });
      }
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