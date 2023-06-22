'use strict';

import {CompanySiteService} from '../services/company-site.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid, MissingParameterError} from 'rf-util';

export class CompanySiteController {
    static async post(req, res) {
        const loc = req.loc;

        const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
        const siteUuid = req.query?.siteUuid ?? req.params?.siteUuid ?? req.body?.siteUuid;

        if (!companyUuid && !siteUuid)
            throw new MissingParameterError(loc._cf('companySite', 'Company UUID'), loc._cf('companySite', 'Site UUID'));

        const options = {attributes:['companyId', 'siteId'], view: true, includeCompany: true, includeSite: true, where: {}};
        if (companyUuid) {
            await checkParameterUuid(companyUuid, loc._cf('companySite', 'Company UUID'));
            options.where.companyUuid = companyUuid;
        }

        if (siteUuid) {
            await checkParameterUuid(companyUuid, loc._cf('companySite', 'Site UUID'));
            options.where.siteUuid = siteUuid;
        }

        if (!req.roles.includes('admin'))
            options.where.siteName = req?.sites ?? null;

        const companySites = await CompanySiteService.getList(options);
        if (!companySites?.length)
            throw new _HttpError(loc._cf('companySite', 'The selected object does not exist or you do not have permission.'), 400);

        const companySite = companySites[0].toJSON();
        if (!companySite.Company.isEnabled || !companySite.Site.isEnabled)
            throw new _HttpError(loc._cf('companySite', 'The selected company is disabled.'), 403);

        const sessionId = req.session.id;
        const siteId = companySite.siteId;

        conf.global.services.SessionSite.createOrUpdate({sessionId, siteId});

        if (companySite.Company.isTranslatable) {
            companySite.Company.title = loc._(companySite.Company.title);
            companySite.Company.description = loc._(companySite.Company.description);
        }

        delete companySite.Company.isTranslatable;

        const menuItem = {
            name: 'company-site',
            parent: 'breadcrumb',
            action: 'object',
            service: 'company-site',
            label: await loc._('Company: %s', companySite.Company.title),
        };

        const data = {
            api: {
                clear: true,
                data: {
                    companyUuid: companySite.Company.uuid,
                },
            },
            menu: [menuItem],
        };

        const SessionDataService = conf.global.services.SessionData;
        if (SessionDataService) {
            const sessionData = await SessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

            sessionData.api ??= {};
            sessionData.api.data ??= {};
            sessionData.api.data.companyUuid = companySite.Company.uuid;

            sessionData.menu ??= [];
            sessionData.menu = sessionData.menu.filter(item => item.parent != 'breadcrumb' && item.name != 'company-site');
            sessionData.menu.push(menuItem);

            await SessionDataService?.setData(sessionId, sessionData);
        }

        data.count = 1;
        data.rows = companySite;

        await conf.global.eventBus?.$emit('companySwitch', data, {sessionId});
        
        conf.global.eventBus?.$emit('sessionUpdated', sessionId);

        res.status(200).send(data);
    }

    static async get(req, res) {
        if ('$object' in req.query)
            return CompanySiteController.getObject(req, res);

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
        if (!req.roles.includes('admin')) {
            options.where ??= {};
            options.where.siteName = req?.sites ?? null;
        }

        options.includeCompany = true;

        const result = await CompanySiteService.getListAndCount(options);
        
        res.status(200).send(result);
    }

    static async getObject(req, res) {
        checkParameter(req.query, '$object');

        const actions = [{
            name: 'select',
            icon: 'get-into',
            actionData: {
                bodyParam: {companyUuid: 'Company.uuid'},
                onSuccess: 'reloadMenu();',
            },
        }];
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('companySite', 'Select company'),
            load: {
                service: 'company-site',
                method: 'get',
            },
            actions: actions,
            properties: [
                {
                    name: 'Company.title',
                    type: 'text',
                    label: await loc._('Title'),
                },
                {
                    name: 'Company.name',
                    type: 'text',
                    label: await loc._('Name'),
                },
                {
                    name: 'Company.description',
                    type: 'text',
                    label: await loc._('Description'),
                },
            ]
        });
    }
}
