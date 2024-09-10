import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, HttpError, getUuidFromRequest, makeContext } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class AssetTypeController extends Controller {
  constructor() {
    super();

    this.service =        dependency.get('assetTypeService');
    this.projectService = dependency.get('projectService');
  }

  async checkDataForProjectId(req, data) {
    if (!conf.filters?.getCurrentProjectId) {
      return data.projectId;
    }
         
    data ??= {};
    if (!data.projectId) {
      if (data.projectUuid) {
        data.projectId = await this.projectService.getSingleIdForUuid(data.projectUuid);
      } else if (data.projectName) {
        data.projectId = await this.projectService.getSingleIdForName(data.projectName);
      } else {
        data.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
        return data.projectId;
      }
        
      if (!data.projectId) {
        throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 404);
      }
    }

    const projectId = await conf.filters.getCurrentProjectId(req) ?? null;
    if (data.projectId != projectId) {
      throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 403);
    }

    return data.projectId;
  }

  async checkUuid(req) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const assetType = await this.service.getSingleOrNullForUuid(uuid, { skipNoRowsError: true, loc });
    if (!assetType) {
      throw new HttpError(loc => loc._c('asset', 'The asset type with UUID %s does not exists.'), 404, uuid);
    }

    const projectId = await this.checkDataForProjectId(req, { projectId: assetType.projectId });

    return { uuid, projectId };
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
        
    const data = { ...req.body };
    await this.checkDataForProjectId(req, data);

    await this.service.create(data, { context: makeContext(req, res) });
  }

  getPermission = 'assetType.get';
  async getData(req) {
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
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.getCurrentProjectId(req) ?? null;
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
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentProjectId(req) ?? null;
    }

    const result = await this.projectService.getListAndCount(options);

    res.status(200).send(result);
  }
}