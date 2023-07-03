'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {checkDataForMissingProperties, completeIncludeOptions, getSingle} from 'sql-util';

export class CompanySiteService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.CompanySite;
    references = {
        company: {
            service: conf.global.services.Company,
            otherName: 'name',
        },
        site: {
            service: conf.global.services.Site,
            otherName: 'name',
        },
        ownerModule: conf.global.services.Module,
    };
    defaultTranslationContext = 'companySite';

    constructor() {
        super();

        this.companyService = conf.global.services.Company.singleton();
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
                siteData = {...data};
                if (siteData.siteDescription)
                    siteData.description = siteData.siteDescription;
            } else {
                if (!company)
                    company = await conf.global.services.Company.singleton().get(data.companyId);

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
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise[options]}
     */
    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes)
                options.attributes = [];
        }

        if (options.includeCompany || options.where.companyName || options.where.companyUuid) {
            let where;
            if (options.isEnabled !== undefined)
                where = {isEnabled: options.isEnabled};

            if (options.where) {
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
            }

            let attributes;
            if (options.includeCompany) {
                attributes = ['uuid', 'name', 'title', 'description', 'isTranslatable', 'isEnabled'];
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

        if (options.includeSite || options.where?.siteName || options.where?.siteUuid) {
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
                attributes = ['uuid', 'name', 'title', 'isTranslatable', 'isEnabled'];
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
        if (rows?.length)
            item = rows[0];
        else
            item = await this.create(data);

        if (data.users) {
            const siteId = item.siteId;
            for (const userRole of data.users)
                await conf.global.services.UserSiteRole.singleton().createIfNotExists({...userRole, siteId, owner: data.owner});
        }

        return item;
    }

    async getForSiteId(siteId, options) {
        const rows = await this.getList({...options, where: {...options?.where, siteId}, limit: 2});
        return getSingle(rows, {params: ['company site', ['site ID = %s', siteId], 'CompanySite'], ...options});
    }

    async getCompanyIdForSiteId(siteId, options) {
        return (await this.getForSiteId(siteId, options))?.companyId;
    }
}