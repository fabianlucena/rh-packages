import { getOptionsFromParamsAndOData, httpErrorHandler } from 'http-util';
import { checkParameter, checkParameterUuid } from 'rf-util';
import dependency from 'rf-dependency';

export class SwitchSiteController {
  static init() {
    this.service = dependency.get('switchSiteService');
  }

  static currentSiteGet(req, res) {
    const siteId = req?.site?.id;
    if (!siteId) {
      return res.status(204).send();
    }

    const definitions = { uuid: 'uuid', name: 'string' },
      options = { view: true, limit: 10, offset: 0 };

    getOptionsFromParamsAndOData(req?.query, definitions, options)
      .then(options => this.service.getSingleForId(siteId, options))
      .then(element => res.status(200).send(element))
      .catch(httpErrorHandler(req, res));
  }

  static async post(req, res) {
    const siteUuid = await checkParameterUuid(
      req.query?.uuid ?? req.params?.uuid ?? req.body?.uuid,
      loc => loc._c('switchSite', 'UUID')
    );
    await this.service.createOrUpdate({
      sessionId: req?.session?.id,
      siteUuid,
    });
    res.status(204).send();
  }

  static async get(req, res) {
    if ('$object' in req.query) {
      return SwitchSiteController.getObject(req, res);
    }

    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0 };

    options = await getOptionsFromParamsAndOData(req?.query, definitions, options);
    if (!req.roles.includes('admin')) {
      options.where ??= {};
      options.where.name = req?.sites ?? null;
    }

    const result = await dependency.get('siteService').getListAndCount(options);
        
    res.status(200).send(result);
  }

  static async getObject(req, res) {
    checkParameter(req.query, '$object');

    const actions = [];
    //if (req.permissions.includes('site.create')) actions.push('create');
    //if (req.permissions.includes('site.edit'))   actions.push('enableDisable', 'edit');
    //if (req.permissions.includes('site.delete')) actions.push('delete');
    //actions.push('search', 'paginate');

    actions.push('select');
                
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
          name: 'isEnabled',
          type: 'boolean',
          label: await loc._('Enabled'),
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
