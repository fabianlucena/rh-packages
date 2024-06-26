import { CompanySiteService } from '../services/company-site.js';
import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, _HttpError } from 'http-util';
import { checkParameter, checkParameterUuid, MissingParameterError } from 'rf-util';

export class CompanySiteController {
  static async post(req, res) {
    const loc = req.loc;

    const companyUuid = req.query?.companyUuid ?? req.params?.companyUuid ?? req.body?.companyUuid;
    const siteUuid = req.query?.siteUuid ?? req.params?.siteUuid ?? req.body?.siteUuid;

    if (!companyUuid && !siteUuid) {
      throw new MissingParameterError(loc._cf('companySite', 'Company UUID'), loc._cf('companySite', 'Site UUID'));
    }

    const options = {
      attributes:['companyId', 'siteId'],
      view: true,
      include: {
        company: true,
        site: true,
      },
      where: {},
    };
    if (companyUuid) {
      await checkParameterUuid(companyUuid, loc._cf('companySite', 'Company UUID'));
      options.where.companyUuid = companyUuid;
    }

    if (siteUuid) {
      await checkParameterUuid(companyUuid, loc._cf('companySite', 'Site UUID'));
      options.where.siteUuid = siteUuid;
    }

    if (!req.roles.includes('admin')) {
      options.where.siteName = req?.sites ?? null;
    }

    const companySites = await CompanySiteService.singleton().getList(options);
    if (!companySites?.length) {
      throw new _HttpError(loc._cf('companySite', 'The selected object does not exist or you do not have permission.'), 400);
    }

    const companySite = companySites[0];
    if (!companySite.company.isEnabled || !companySite.site.isEnabled) {
      throw new _HttpError(loc._cf('companySite', 'The selected company is disabled.'), 403);
    }

    const sessionId = req.session.id;
    const siteId = companySite.siteId;

    conf.global.services.SessionSite.singleton().createOrUpdate({ sessionId, siteId });

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

    const sessionDataService = conf.global.services.SessionData.singleton();
    if (sessionDataService) {
      const sessionData = await sessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

      sessionData.api ??= {};
      sessionData.api.data = {};
      sessionData.api.data.companyUuid = companySite.company.uuid;

      sessionData.menu ??= [];
      sessionData.menu = sessionData.menu.filter(item => item.parent != 'breadcrumb' && item.name != 'company-site');
      sessionData.menu.push(menuItem);

      await sessionDataService.setData(sessionId, sessionData);
    }

    data.count = 1;
    data.rows = companySite;

    await conf.global.eventBus?.$emit('companySwitch', data, { sessionId });
    await conf.global.eventBus?.$emit('sessionUpdated', sessionId);

    req.log?.info(`Company switched to: ${companySite.company.title}.`, { sessionId, siteId, companyName: companySite.company.name });

    res.status(200).send(data);
  }

  static async get(req, res) {
    if ('$object' in req.query) {
      return CompanySiteController.getObject(req, res);
    }

    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
    if (!req.roles.includes('admin')) {
      options.where ??= {};
      options.where.siteName = req?.sites ?? null;
    }

    options.include = {
      company: true,
      ...options.include,
    };

    const result = await CompanySiteService.singleton().getListAndCount(options);
        
    res.status(200).send(result);
  }

  static async getObject(req, res) {
    checkParameter(req.query, '$object');

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
