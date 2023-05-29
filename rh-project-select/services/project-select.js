import {conf} from '../conf.js';
import {checkDataForMissingProperties, completeIncludeOptions} from 'sql-util';

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
        if (!options)
            options = {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = [];
        }

        if (options.includeCompany || options.where.companyName || options.where.companyUuid) {
            let where;
            if (options.isEnabled !== undefined)
                where = {isEnabled: options.isEnabled};

            if (options.where.companyName) {
                where ??= {};
                where.name = options.where.companyName;
                delete options.where.companyName;
            }

            if (options.where.companyUuid) {
                where ??= {};
                where.uuid = options.where.companyUuid;
                delete options.where.companyUuid;
            }

            let attributes;
            if (options.includeCompany) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
                delete options.includeCompany;
            } else 
                attributes = [];

            completeIncludeOptions(
                options,
                'Company',
                {
                    model: conf.global.models.Company,
                    attributes,
                    where,
                }
            );
        }

        if (options.includeSite || options.where.siteName || options.where.siteUuid) {
            let where;
            if (options.isEnabled !== undefined)
                where = {isEnabled: options.isEnabled};

            if (options.where.siteName) {
                where ??= {};
                where.name = options.where.siteName;
                delete options.where.siteName;
            }

            if (options.where.siteUuid) {
                where ??= {};
                where.uuid = options.where.siteUuid;
                delete options.where.siteUuid;
            }

            let attributes;
            if (options.includeSite) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
                delete options.includeSite;
            } else 
                attributes = [];

            completeIncludeOptions(
                options,
                'Site',
                {
                    model: conf.global.models.Site,
                    attributes,
                    where,
                }
            );
        }

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
        let item;
        if (rows?.length)
            item = rows[0];
        else
            item = await CompanySiteService.create(data);

        if (data.users) {
            const siteId = item.siteId;
            for (const userRole of data.users)
                await conf.global.services.UserSiteRole.createIfNotExists({...userRole, siteId, owner: data.owner});
        }

        return item;
    }
}