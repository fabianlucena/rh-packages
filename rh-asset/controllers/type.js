import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, HttpError, makeContext } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class AssetTypeController extends Controller {
  constructor() {
    super();

    this.service =        dependency.get('assetTypeService');
    this.projectService = dependency.get('projectService');
  }

  async checkDataForProjectId(data, context) {
    if (!conf.filters?.projectId) {
      return data.projectId;
    }
         
    data ??= {};
    if (!data.projectId) {
      if (data.projectUuid) {
        data.projectId = await this.projectService.getSingleIdForUuid(data.projectUuid);
      } else if (data.projectName) {
        data.projectId = await this.projectService.getSingleIdForName(data.projectName);
      } else {
        data.projectId = await conf.filters.projectId(context) ?? null;
        return data.projectId;
      }
        
      if (!data.projectId) {
        throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 404);
      }
    }

    const projectId = await conf.filters.projectId(context) ?? null;
    if (data.projectId != projectId) {
      throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 403);
    }

    return data.projectId;
  }

  postPermission = 'assetType.create';
  async post(req, res) {
    checkParameter(
      req?.body,
      {
        name:  loc => loc._c('asset', 'Name'),
        title: loc => loc._c('asset', 'Title'),
      },
    );
        
    const context = makeContext(req, res);
    const data = { ...req.body };
    await this.checkDataForProjectId(data, context);

    await this.service.create(data, { context });
  }

  getPermission = 'assetType.get';
  async getData(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit:  10,
      offset:  0,
      include: {
        project: true,
      },
      loc,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.projectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.projectId(makeContext(req, res)) ?? null;
    }

    return this.service.getListAndCount(options);
  }

  deleteForUuidPermission =      'assetType.delete';
  postEnableForUuidPermission =  'assetType.edit';
  postDisableForUuidPermission = 'assetType.edit';
  patchForUuidPermission =       'assetType.edit';

  'getPermission /project' = 'assetType.edit';
  async 'get /project'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.projectId) {
      options.where ??= {};
      options.where.id = await conf.filters.projectId(makeContext(req, res)) ?? null;
    }

    const result = await this.projectService.getListAndCount(options);

    res.status(200).send(result);
  }
}