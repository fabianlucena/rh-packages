import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { getOptionsFromParamsAndOData, makeContext } from 'http-util';
import { MissingParameterError } from 'rf-util';

export class PerspectiveController extends Controller {
  constructor() {
    super();

    this.service =            dependency.get('perspectiveService');
    this.permissionService =  dependency.get('permissionService');
  }

  postPermission =               'perspective.create';
  getPermission =                'perspective.get';
  deleteForUuidPermission =      'perspective.delete';
  postEnableForUuidPermission =  'perspective.edit';
  postDisableForUuidPermission = 'perspective.edit';
  patchForUuidPermission =       'perspective.edit';

  'getPermission /permission' = 'perspective.edit';
  async 'get /permission'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = {
      view: true,
      where: { permission: { name: req.permissions ?? null }},
      offset: 0,
      loc,
    };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.permissionService.getListAndCount(options);
    result = await this.permissionService.sanitize(result);

    return result;
  }

  'postPermission /switch/:uuid' = 'perspective.switch';
  async 'post /switch/:uuid'(req, res) {
    const uuid = req.query?.perspectiveUuid ?? req.params?.uuid ?? req.body?.perspectiveUuid;
    if (!uuid) {
      throw new MissingParameterError(loc => loc._c('perspective', 'Perspective UUID'));
    }

    return await this.service.switchToUuid(
      uuid,
      { context: makeContext(req, res) }
    );
  }
}