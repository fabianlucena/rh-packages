import { conf } from '../conf.js';
import { ServiceOwnerModule } from 'rf-service';
import { checkDataForMissingProperties } from 'sql-util';

export class CompanySiteService extends ServiceOwnerModule {
  references = {
    company: { otherName: 'name' },
    site: { otherName: 'name' },
  };

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
          company = await conf.global.services.Company.singleton().get(data.companyId);
        }

        siteData.name = company.name;
        siteData.title = company.title;
        siteData.ownerModuleId = company.ownerModuleId;
      }

      const site = await conf.global.services.Site.singleton().createIfNotExists(siteData);
      data.siteId = site.id;

      await checkDataForMissingProperties(data, 'CompanySiteService', 'siteId');
    }

    return conf.global.models.CompanySite.create(data);
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