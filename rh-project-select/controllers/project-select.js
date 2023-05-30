'use strict';

import {conf} from '../conf.js';
import {getOptionsFromParamsAndODataAsync, _HttpError} from 'http-util';
import {checkParameter, /*checkParameterUuid, */ MissingParameterError} from 'rf-util';

export class ProjectSelectController {
    static async post(req, res) {
        const loc = req.loc;

        const projectUuid = req.query?.projectUuid ?? req.params?.projectUuid ?? req.body?.projectUuid;
        if (!projectUuid)
            throw new MissingParameterError(loc._f('Project UUID'));

        /*const options = {attributes:['siteId'], view: true, includeCompany: true, where: {}};
        if (companyUuid) {
            await checkParameterUuid(companyUuid, loc._f('Company UUID'));
            options.where.companyUuid = companyUuid;
        }

        if (siteUuid) {
            await checkParameterUuid(companyUuid, loc._f('Site UUID'));
            options.where.siteUuid = siteUuid;
        }

        if (!req.roles.includes('admin'))
            options.where.siteName = req?.sites ?? null;*/

        let project = await conf.global.services.Project.getForUuid(projectUuid, {skipNoRowsError: true});
        if (!project)
            throw new _HttpError(loc._f('The selected project does not exist or you do not have permission.'), 400);

        project = project.toJSON();

        if (project.isTranslatable) {
            project.title = loc._(project.title);
            project.description = loc._(project.description);
        }

        delete project.isTranslatable;

        const menuItem = {
            name: 'project-select',
            parent: 'breadcrumb',
            action: 'object',
            service: 'project-select',
            label: await loc._('Project: %s', project.title),
        };
        const data = {
            api: {
                data: {
                    projectUuid: project.uuid,
                },
            },
            menu: [menuItem],
        };

        const sessionId = req.session.id;
        const SessionDataService = conf.global.services.SessionData;
        if (SessionDataService) {
            const sessionData = await SessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};
            sessionData.api ??= {};
            sessionData.api.data ??= {};
            sessionData.api.data.projectUuid = project.uuid;

            sessionData.menu ??= [];
            sessionData.menu = sessionData.menu.filter(item => item.name != 'project-select');
            sessionData.menu.push(menuItem);

            console.log(sessionData.menu);

            await SessionDataService?.setData(sessionId, sessionData);
        }

        conf.global.eventBus?.$emit('sessionUpdated', sessionId);

        res.status(200).send({length: 1, rows: project, ...data});
    }

    static async get(req, res) {
        if ('$object' in req.query)
            return ProjectSelectController.getObject(req, res);

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndODataAsync(req?.query, definitions, options);
        const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
        if (!companyUuid) {
            if (!req.roles.includes('admin'))
                throw new MissingParameterError(req.loc._f('Company UUID'));
        } else {
            options.where ??= {};
            options.where.companyUuid = companyUuid;
        }

        options.includeCompany = true;

        const result = await conf.global.services.Project.getListAndCount(options);
        
        res.status(200).send(result);
    }

    static async getObject(req, res) {
        checkParameter(req.query, '$object');

        const actions = [{
            name: 'select',
            actionData: {
                bodyParam: {projectUuid: 'uuid'},
                onSuccess: 'reloadMenu();',
            },
        }];
                
        let loc = req.loc;

        res.status(200).send({
            title: await loc._('User'),
            load: {
                service: 'project-select',
                method: 'get',
                queryParam: {
                    companyUuid: 'companyUuid',
                },
            },
            actions: actions,
            properties: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._('Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._('Name'),
                },
                {
                    name: 'description',
                    type: 'text',
                    label: await loc._('Description'),
                },
            ]
        });
    }
}
