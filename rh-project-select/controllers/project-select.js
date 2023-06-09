'use strict';

import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError} from 'http-util';
import {checkParameter, MissingParameterError} from 'rf-util';

export class ProjectSelectController {
    static async post(req, res) {
        const loc = req.loc;

        const projectUuid = req.query?.projectUuid ?? req.params?.projectUuid ?? req.body?.projectUuid;
        if (!projectUuid)
            throw new MissingParameterError(loc._f('Project UUID'));

        const options = {skipNoRowsError: true};
        let project = await conf.global.services.Project.getForUuid(projectUuid, options);
        if (!project)
            throw new _HttpError(loc._f('The selected project does not exist or you do not have permission to access it.'), 400);

        if (!project.isEnabled)
            throw new _HttpError(loc._f('The selected project is disabled.'), 403);

        project = project.toJSON();

        const SessionDataService = conf.global.services.SessionData;
        if (!SessionDataService)
            throw new _HttpError(loc._f('You do not have permission to select this project.'), 400);

        const sessionId = req.session.id;

        if (!req.roles.includes('admin')) {
            let companyId;
            if (conf.filters?.getCurrentCompanyId)
                companyId = await conf.filters.getCurrentCompanyId(req);

            if (companyId != project.companyId)
                throw new _HttpError(loc._f('You do not have permission to select this project.'), 400);
        }

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
            count: 1,
            rows: project,
            api: {
                data: {
                    projectUuid: project.uuid,
                },
            },
            menu: [menuItem],
        };

        const sessionData = await SessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

        sessionData.api ??= {};
        sessionData.api.data ??= {};
        sessionData.api.data.projectUuid = project.uuid;

        sessionData.menu ??= [];
        sessionData.menu = sessionData.menu.filter(item => item.name != 'project-select');
        sessionData.menu.push(menuItem);

        await SessionDataService.setData(sessionId, sessionData);

        await Promise.all(conf.global.eventBus?.$emit('projectSwitch', data, {sessionId}));
        
        conf.global.eventBus?.$emit('sessionUpdated', sessionId);

        res.status(200).send(data);
    }

    static async get(req, res) {
        if ('$object' in req.query)
            return ProjectSelectController.getObject(req, res);

        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {view: true, limit: 10, offset: 0};

        options = await getOptionsFromParamsAndOData(req?.query, definitions, options);

        const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
        if (companyUuid) {
            options.where ??= {};
            options.where.companyUuid = companyUuid;
        }
        
        if (conf.filters?.getCurrentCompanyId) {
            options.where ??= {};
            options.where.companyId = await conf.filters.getCurrentCompanyId(req) ?? null;
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
            title: await loc._('Select project'),
            load: {
                service: 'project-select',
                method: 'get',
                queryParams: {
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
