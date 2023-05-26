import {conf} from '../conf.js';
import {checkDataForMissingProperties} from 'sql-util';

export class CompanySiteService {
    /**
     * Complete the data object with the companyId property if not exists. 
     * @param {{company: string, companyId: integer, ...}} data 
     * @returns {Promise[data]}
     */
    static async completeCompanyId(data) {
        if (!data.companyId && (data.company || data.name))
            data.companyId = await conf.global.services.Company.getIdForName(data.company ?? data.name, {skipNoRowsError: true});
    
        return data;
    }

    /**
     * Complete the data object with the siteId property if not exists. 
     * @param {{site: string, siteId: integer, ...}} data 
     * @returns {Promise[data]}
     */
    static async completeSiteId(data) {
        if (!data.siteId && (data.site || data.name))
            data.siteId = await conf.global.services.Site.getIdForName(data.site ?? data.name, {skipNoRowsError: true});

        return data;
    }

    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise[data]}
     */
    static async completeOwnerModuleId(data) {
        if (!data.ownerModuleId && data.ownerModule)
            data.ownerModuleId = await conf.global.services.Module.getIdForName(data.ownerModule);

        return data;
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
    static async create(data) {
        let company;
        if (!data.companyId) {
            if (typeof data.company === 'string')
                await CompanySiteService.completeCompanyId(data);
            else if (data.name && data.title) {
                company = await conf.global.services.Company.createIfNotExists(data);
                data.companyId = company.id;
            }

            await checkDataForMissingProperties(data, 'CompanySiteService', 'companyId');
        }

        if (!data.siteId) {
            if (typeof data.site === 'string')
                await CompanySiteService.completeSiteId(data);
            else {
                let siteData;
                if (data.name && data.title) {
                    siteData = {...data};
                    if (siteData.siteDescription)
                        siteData.description = siteData.siteDescription;
                } else {
                    if (!company)
                        company = await conf.global.services.Company.get(data.companyId);

                    siteData.name = company.name;
                    siteData.title = company.title;
                    siteData.ownerModuleId = company.ownerModuleId;
                }

                const site = await conf.global.services.Site.createIfNotExists(siteData);
                data.siteId = site.id;
            }

            await checkDataForMissingProperties(data, 'CompanySiteService', 'siteId');
        }

        await CompanySiteService.completeOwnerModuleId(data);

        return conf.global.models.CompanySite.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise[options]}
     */
    static async getListOptions(options) {
        return options;
    }

    /**
     * Gets a list of user CompanySite rows.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise[CompanySite]}
     */
    static async getList(options) {
        return conf.global.models.CompanySite.findAll(await CompanySiteService.getListOptions(options));
    }

    /**
     * Gets a list of user CompanySite rows and the rows count.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{GroupList, count}}
     */
    static async getListAndCount(options) {
        return conf.global.models.CompanySite.findAndCountAll(await CompanySiteService.getListOptions(options));
    }

    /**
     * Creates a new user CompanySite row into DB if not exists.
     * @param {data} data - data for the new CompanySite @see create.
     * @returns {Promise[CompanySite]}
     */
    static async createIfNotExists(data, options) {
        await CompanySiteService.completeCompanyId(data);
        await CompanySiteService.completeSiteId(data);
        
        const rows = await CompanySiteService.getList({...options, where:{...options?.where, companyId: data.companyId ?? null, siteId: data.siteId ?? null}});
        if (rows?.length)
            return true;

        return CompanySiteService.create(data);
    }
}