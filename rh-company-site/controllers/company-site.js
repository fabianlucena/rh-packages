'use strict';

import {CompanySiteService} from '../services/company-site.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndODataAsync, _HttpError} from 'http-util';
import {checkParameter, checkParameterUuid, MissingParameterError} from 'rf-util';

export class CompanySiteController {
    static async post(req, res) {
        const loc = req.loc;

        const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
        const siteUuid = req.query?.siteUuid ?? req.params?.siteUuid ?? req.body?.siteUuid;

        if (!companyUuid && !siteUuid)
            throw new MissingParameterError(loc._f('Company UUID'), loc._f('Site UUID'));

        const options = {attributes:['siteId'], view: true, includeCompany: true, where: {}};
        if (companyUuid) {
            await checkParameterUuid(companyUuid, loc._f('Company UUID'));
            options.where.companyUuid = companyUuid;
        }

        if (siteUuid) {
            await checkParameterUuid(companyUuid, loc._f('Site UUID'));
            options.where.siteUuid = siteUuid;
        }

        if (!req.roles.includes('admin'))
            options.where.siteName = req?.sites ?? null;

        const companySites = await CompanySiteService.getList(options);
        if (!companySites?.length)
            throw new _HttpError(loc._f('The selected object does not exist or you do not have permission.'), 400);

        const companySite = companySites[0].toJSON();
        const sessionId = req.session.id;
        const siteId = companySite.siteId;

        conf.global.services.SessionSite.createOrUpdate({sessionId, siteId});

        const data = {
            api: {
                fixedBodyParam: {
                    companyUuid: companySite.Company.uuid,
                },
            },
            menu: [
                {
                    parent: 'breadcrumb',
                    action: 'object',
                    service: 'company-site',
                    label: await loc._('Company: %s', companySite.Company.title),
                }
            ],
        };

        await conf.global.services.SessionData?.addData(sessionId, data);

        conf.global.services.Session?.deleteFromCacheForSessionId(sessionId);
        conf.global.services.Privileges?.deleteFromCacheForSessionId(sessionId);

        if (companySite.Company.isTranslatable) {
            companySite.Company.title = loc._(companySite.Company.title);
            companySite.Company.description = loc._(companySite.Company.description);
        }

        delete companySite.Company.isTranslatable;

        res.status(200).send({length: 1, rows: companySite, ...data});
    }

    static async get(req, res) {
        if ('$object' in req.query)
            return CompanySiteController.getObject(req, res);

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndODataAsync(req?.query, definitions, options);
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
            actionData: {
                bodyParam: {companyUuid: 'Company.uuid'},
                onSuccess: 'reloadMenu();',
            },
        }];
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('User'),
            load: {
                service: 'site',
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
