import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData, HttpError, makeContext } from 'http-util';
import { checkParameter } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class AssetController extends Controller {
  constructor() {
    super();

    this.service =          dependency.get('assetService');
    this.assetTypeService = dependency.get('assetTypeService');
    this.projectService =   dependency.get('projectService');
  }

  async checkDataForProjectId(data, context) {
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
        data.projectId = await conf.filters.getCurrentProjectId(context) ?? null;
        return data.projectId;
      }
        
      if (!data.projectId) {
        throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 404);
      }
    }

    const projectId = await conf.filters.getCurrentProjectId(context) ?? null;
    if (data.projectId != projectId) {
      throw new HttpError(loc => loc._c('asset', 'The project does not exist or you do not have permission to access it.'), 403);
    }

    return data.projectId;
  }

  postPermission = 'asset.create';
  async post(req, res) {
    checkParameter(
      req?.body,
      {
        name:  loc => loc._c('asset', 'Name'),
        title: loc => loc._c('asset', 'Title'),
        type:  loc => loc._c('asset', 'Type'),
      },
    );
        
    const data = { ...req.body };
    const context = makeContext(req, res);
    await this.checkDataForProjectId(data, context);

    await this.service.create(data, { context });
  }

  getPermission = 'asset.get';
  async getData(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      limit:  10,
      offset:  0,
      include: {
        project: true,
        type:    true,
      },
      loc,
    };

    const context = makeContext(req, res);
    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.projectId = await conf.filters.getCurrentProjectId(context) ?? null;
    }

    const eventOptions = { entity: 'Asset', context, options };
    await conf.global.eventBus?.$emit('Asset.response.getting', eventOptions);
    let result = await this.service.getListAndCount(options);
    await conf.global.eventBus?.$emit('Asset.response.getted', { ...eventOptions, result });
    result = await this.service.sanitize(result);

    return result;
  }

  deleteForUuidPermission =      'asset.delete';
  postEnableForUuidPermission =  'asset.edit';
  postDisableForUuidPermission = 'asset.edit';
  patchForUuidPermission =       'asset.edit';

  'getPermission /project' = 'asset.edit';
  async 'get /project'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentProjectId(makeContext(req, res)) ?? null;
    }

    const result = await this.projectService.getListAndCount(options);

    res.status(200).send(result);
  }

  'getPermission /type' = 'asset.edit';
  async 'get /type'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.assetTypeService.getListAndCount(options);

    res.status(200).send(result);
  }
}