import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import { checkParameter, MissingParameterError } from 'rf-util';

const branchService = conf.global.services.Branch.singleton();

export class BranchSelectController {
  static async post(req, res) {
    const branchUuid = req.query?.branchUuid ?? req.params?.branchUuid ?? req.body?.branchUuid;
    if (!branchUuid) {
      throw new MissingParameterError(loc => loc._c('branchSelect', 'Branch UUID'));
    }

    const loc = req.loc;
    const options = { loc, skipNoRowsError: true };
    let branch = await branchService.getForUuidOrNull(branchUuid, options);
    if (!branch) {
      throw new HttpError(loc => loc._c('branchSelect', 'The selected branch does not exist or you do not have permission to access it.'), 400);
    }

    if (!branch.isEnabled) {
      throw new HttpError(loc => loc._c('branchSelect', 'The selected branch is disabled.'), 403);
    }

    const sessionDataService = conf.global.services.SessionData.singleton();
    if (!sessionDataService) {
      throw new HttpError(loc => loc._c('branchSelect', 'You do not have permission to select this branch.'), 400);
    }

    const sessionId = req.session.id;

    if (!req.roles.includes('admin')) {
      let companyId;
      if (conf.filters?.getCurrentCompanyId) {
        companyId = await conf.filters.getCurrentCompanyId(req);
      }

      if (companyId != branch.companyId) {
        throw new HttpError(loc => loc._c('branchSelect', 'You do not have permission to select this branch.'), 400);
      }
    }

    branch = await branchService.sanitize(branch);

    const menuItem = {
      name: 'branch-select',
      parent: 'breadcrumb',
      action: 'object',
      service: 'branch-select',
      label: await loc._('Branch: %s', branch.title),
      icon: 'branch',
    };
    const data = {
      count: 1,
      rows: branch,
      api: {
        data: {
          branchUuid: branch.uuid,
        },
      },
      menu: [menuItem],
    };

    const sessionData = await sessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

    sessionData.api ??= {};
    sessionData.api.data ??= {};
    sessionData.api.data.branchUuid = branch.uuid;

    sessionData.menu ??= [];
    sessionData.menu = sessionData.menu.filter(item => item.name != 'branch-select');
    sessionData.menu.push(menuItem);

    await sessionDataService.setData(sessionId, sessionData);

    await conf.global.eventBus?.$emit('branchSwitch', data, { sessionId });
    await conf.global.eventBus?.$emit('sessionUpdated', sessionId);

    req.log?.info(`Branch switched to: ${branch.title}.`, { sessionId, branchName: branch.name });

    res.status(200).send(data);
  }

  static async get(req, res) {
    if ('$object' in req.query) {
      return BranchSelectController.getObject(req, res);
    }

    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit: 10,
      offset: 0,
    };

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

    options.include = {
      company: true,
      ...options.include,
    };

    const result = await branchService.getListAndCount(options);
        
    res.status(200).send(result);
  }

  static async getObject(req, res) {
    checkParameter(req.query, '$object');

    const actions = [
      {
        name: 'select',
        type: 'button',
        icon: 'get-into',
        actionData: {
          bodyParam: { branchUuid: 'uuid' },
          onSuccess: { reloadMenu: true },
        },
      },
    ];

    let loc = req.loc;

    res.status(200).send({
      title: await loc._('Select branch'),
      load: {
        service: 'branch-select',
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
