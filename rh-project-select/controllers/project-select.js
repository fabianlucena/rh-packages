import { dependency } from 'rf-dependency';
import { conf } from '../conf.js';
import { getOptionsFromParamsAndOData, makeContext } from 'http-util';
import { checkParameter, MissingParameterError } from 'rf-util';
import { Controller } from 'rh-controller';
import { getFiltersForContext } from '../rh-project-select.js';

export class ProjectSelectController extends Controller {
  constructor() {
    super();
    this.eventBus = dependency.get('eventBus', null);
    this.projectService =     dependency.get('projectService');
    this.sessionDataService = dependency.get('sessionDataService', null);
  }

  postPermission = 'project-select.switch';
  async post(req, res) {
    const projectUuid = req.query?.projectUuid ?? req.params?.projectUuid ?? req.body?.projectUuid;
    if (!projectUuid) {
      throw new MissingParameterError(loc => loc._c('projectSelect', 'Project UUID'));
    }

    return this.service.selectForUuid(projectUuid, { context: makeContext(req, res) });
  }

  getPermission = 'project-select.switch';
  async getData(req, res) {
    const definitions = {
      uuid: 'uuid',
      name: 'string',
    };
    if (conf.queryParams) {
      Object.keys(conf.queryParams)
        .forEach(k => definitions[k] = 'string');
    }
    let options = {
      view: true,
      limit: 10,
      offset: 0,
      where: await getFiltersForContext(makeContext(req, res)),
    };

    options = await getOptionsFromParamsAndOData(
      req?.query,
      definitions,
      options,
    );

    const result = await this.projectService.getListAndCount(options);

    return result;
  }

  async getObject(req) {
    checkParameter(req.query, '$object');

    const loc = req.loc;

    const actions = [
      {
        name: 'select',
        type: 'button',
        icon: 'get-into',
        actionData: {
          bodyParam: { projectUuid: 'uuid' },
          onSuccess: { reloadMenu: true },
        },
      },
    ];

    const properties = [
      {
        name: 'title',
        type: 'text',
        label: await loc._c('projectSelect', 'Title'),
      },
      {
        name: 'name',
        type: 'text',
        label: await loc._c('projectSelect', 'Name'),
      },
      {
        name: 'description',
        type: 'text',
        label: await loc._c('projectSelect', 'Description'),
      },
    ];

    let queryParams;
    if (conf.queryParams) {
      queryParams = conf.queryParams;
    }

    const object = {
      title: await loc._c('projectSelect', 'Select project'),
      load: {
        service: 'project-select',
        method: 'get',
        queryParams,
      },
      actions,
      properties,
    };

    return object;
  }
}
