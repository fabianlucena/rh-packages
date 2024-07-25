import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, HttpError, makeContext } from 'http-util';
import { checkParameterUuid, MissingParameterError } from 'rf-util';
import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';

export class CompanySiteController extends Controller {
  constructor() {
    super();

    this.service =            dependency.get('companySiteService');
    this.sessionSiteService = dependency.get('sessionSiteService');
    this.sessionDataService = dependency.get('sessionDataService');
  }

  postPermission = 'company-site.switch';
  async post(req, res) {
    const loc = req.loc;

    const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
    const siteUuid = req.query?.siteUuid ?? req.params?.siteUuid ?? req.body?.siteUuid;

    if (!companyUuid && !siteUuid) {
      throw new MissingParameterError(
        loc => loc._c('companySite', 'Company UUID'),
        loc => loc._c('companySite', 'Site UUID'),
      );
    }

    const options = {
      attributes:['companyId', 'siteId'],
      view: true,
      include: {
        company: {},
        site:    {},
      },
      where: {},
    };
    if (companyUuid) {
      await checkParameterUuid(companyUuid, loc => loc._c('companySite', 'Company UUID'));
      options.where.company = { uuid: companyUuid };
    }

    if (siteUuid) {
      await checkParameterUuid(companyUuid, loc => loc._c('companySite', 'Site UUID'));
      options.where.site = { uuid: siteUuid };
    }

    if (!req.roles.includes('admin')) {
      options.where.site ??= {};
      options.where.site.name = req?.sites ?? null;
    }

    const companySites = await this.service.getList(options);
    if (!companySites?.length) {
      throw new HttpError(loc => loc._c('companySite', 'The selected object does not exist or you do not have permission.'), 400);
    }

    const companySite = companySites[0];
    if (!companySite.company.isEnabled || !companySite.site.isEnabled) {
      throw new HttpError(loc => loc._c('companySite', 'The selected company is disabled.'), 403);
    }

    const sessionId = req.session.id;
    const siteId = companySite.siteId;

    this.sessionSiteService.createOrUpdate({ sessionId, siteId });

    if (companySite.company.isTranslatable) {
      companySite.company.title = await loc._(companySite.company.title);
      companySite.company.description = await loc._(companySite.company.description);
    }

    delete companySite.company.isTranslatable;

    const menuItem = {
      name: 'company-site',
      parent: 'breadcrumb',
      action: 'object',
      service: 'company-site',
      label: await loc._('Company: %s', companySite.company.title),
      icon: 'company',
    };

    const data = {
      api: {
        clear: true,
        data: {
          companyUuid: companySite.company.uuid,
        },
      },
      menu: [menuItem],
    };

    if (this.sessionDataService) {
      const sessionData = await this.sessionDataService.getDataOrNullForSessionId(sessionId) ?? {};

      sessionData.api ??= {};
      sessionData.api.data = {};
      sessionData.api.data.companyUuid = companySite.company.uuid;

      sessionData.menu ??= [];
      sessionData.menu = sessionData.menu.filter(item => item.parent != 'breadcrumb' && item.name != 'company-site');
      sessionData.menu.push(menuItem);

      await this.sessionDataService.setData(sessionId, sessionData);
    }

    data.count = 1;
    data.rows = companySite;

    const context = makeContext(req, res),
      eventOptions = { entity: 'CompanySite', context, sessionId };
    await conf.global.eventBus?.$emit('companySwitch', { ...eventOptions, data });
    await conf.global.eventBus?.$emit('sessionUpdated', eventOptions);

    req.log?.info(`Company switched to: ${companySite.company.title}.`, { sessionId, siteId, companyName: companySite.company.name });

    return data;
  }

  getPermission = 'company-site.switch';
  async getData(req) {
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
    if (!req.roles.includes('admin')) {
      options.where ??= {};
      options.where.site ??= {};
      options.where.site.name = req?.sites ?? null;
    }

    options.include = {
      company: true,
      ...options.include,
    };

    const result = await this.service.getListAndCount(options);
        
    return result;
  }

  async getObject(req, res) {
    const actions = [{
      name: 'select',
      type: 'button',
      icon: 'get-into',
      actionData: {
        bodyParam: { companyUuid: 'company.uuid' },
        onSuccess: { reloadMenu: true },
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
          name: 'company.title',
          type: 'text',
          label: await loc._('Title'),
        },
        {
          name: 'company.name',
          type: 'text',
          label: await loc._('Name'),
        },
        {
          name: 'company.description',
          type: 'text',
          label: await loc._('Description'),
        },
      ]
    });
  }
}
