import {MainCompanyService} from '../services/main-company.js';
import {conf} from '../conf.js';
import {getOptionsFromParamsAndOData, _HttpError, ConflictError} from 'http-util';
import {checkParameter, checkParameterUuid} from 'rf-util';

const mainCompanyService = MainCompanyService.singleton();
const companyService = conf.global.services.Company.singleton();
const siteService = conf.global.services.Site.singleton();

export class MainCompanyController {
    static async checkUuid(req, uuid) {
        const maincompany = await mainCompanyService.getForUuid(uuid, {skipNoRowsError: true});
        if (!maincompany) {
            throw new _HttpError(req.loc._cf('mainCompany', 'The main company with UUID %s does not exists.'), 404, uuid);
        }

        return true;
    }

    static async get(req, res) {
        if ('$grid' in req.query) {
            return this.getGrid(req, res);
        } else if ('$form' in req.query) {
            return this.getForm(req, res);
        }
            
        const definitions = {uuid: 'uuid', name: 'string'};
        let options = {
            limit: 10,
            offset: 0,
            view: true,
            includeProject: true,
            includeOwner: true,
            where: {},
            loc: req.loc,
            includeCompany: true,
        };

        options = await getOptionsFromParamsAndOData({...req.query, ...req.params}, definitions, options);

        if (options.where?.uuid) {
            options.where.companyUuid = options.where.uuid;
            delete options.where.uuid;
        }

        const result = await mainCompanyService.getListAndCount(options);

        res.status(200).send(result);
    }

    static async getGrid(req, res) {
        checkParameter(req.query, '$grid');

        const actions = [];
        if (req.permissions.includes('main-company.create')) actions.push('create');
        if (req.permissions.includes('main-company.edit'))   actions.push('enableDisable', 'edit');
        if (req.permissions.includes('main-company.delete')) actions.push('delete');
        actions.push('search', 'paginate');
        
        let loc = req.loc;

        res.status(200).send({
            title: await loc._c('mainCompany', 'Main companies'),
            service: 'main-company',
            actions: actions,
            columns: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._c('mainCompany', 'Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._c('mainCompany', 'Name'),
                },
            ]
        });
    }

    static async getForm(req, res) {
        checkParameter(req.query, '$form');

        let loc = req.loc;
        res.status(200).send({
            title: await loc._c('mainCompany', 'Main company'),
            action: 'main-company',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    label: await loc._c('mainCompany', 'Title'),
                    placeholder: await loc._c('mainCompany', 'Title'),
                },
                {
                    name: 'name',
                    type: 'text',
                    label: await loc._c('mainCompany', 'Name'),
                    placeholder: await loc._c('mainCompany', 'Name'),
                    readonly: {
                        create: false,
                        defaultValue: true,
                    },
                },
                {
                    name: 'isEnabled',
                    type: 'checkbox',
                    label: await loc._c('mainCompany', 'Enabled'),
                    placeholder: await loc._c('mainCompany', 'Enabled'),
                    value: true,
                },
                {
                    name: 'description',
                    type: 'textArea',
                    label: await loc._c('mainCompany', 'Description'),
                    placeholder: await loc._c('mainCompany', 'Description'),
                },
            ],
        });
    }
    
    static async post(req, res) {
        const loc = req.loc;
        checkParameter(req?.body, {name: loc._cf('mainCompany', 'Name'), title: loc._cf('mainCompany', 'Title')});
        if (await companyService.getForName(req.body.name, {skipNoRowsError: true})) {
            throw new ConflictError();
        }

        if (await siteService.getForName(req.body.name, {skipNoRowsError: true})) {
            throw new ConflictError();
        }

        const data = {...req.body};
        if (!data.owner && !data.ownerId) {
            data.ownerId = req.user.id;
            if (!data.ownerId) {
                throw new _HttpError(req.loc._cf('mainCompany', 'The main company data does not have a owner.'));
            }
        }

        await mainCompanyService.create(data);

        res.status(204).send();
    }

    static async delete(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('mainCompany', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsDeleted = await mainCompanyService.deleteForUuid(uuid);
        if (!rowsDeleted) {
            throw new _HttpError(req.loc._cf('mainCompany', 'The main company with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    static async enablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('mainCompany', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await mainCompanyService.enableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('mainCompany', 'The main company with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    static async disablePost(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('mainCompany', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await mainCompanyService.disableForUuid(uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('mainCompany', 'The main company with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }

    static async patch(req, res) {
        const uuid = await checkParameterUuid(req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid, req.loc._cf('scenario', 'UUID'));
        await this.checkUuid(req, uuid);

        const rowsUpdated = await mainCompanyService.updateForUuid(req.body, uuid);
        if (!rowsUpdated) {
            throw new _HttpError(req.loc._cf('mainCompany', 'The main company with UUID %s does not exists.'), 403, uuid);
        }

        res.sendStatus(204);
    }
}