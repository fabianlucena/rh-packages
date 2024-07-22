import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import { MissingParameterError } from 'rf-util';

export class PerspectiveController extends Controller {
  constructor() {
    super();

    this.service =            dependency.get('perspectiveService');
    this.permissionService =  dependency.get('permissionService');
    this.sessionDataService = dependency.get('sessionDataService');
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
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.permissionService.getListAndCount(options);
    result = await this.permissionService.sanitize(result);

    return result;
  }

  'postPermission /switch/:uuid' = 'perspective.switch';
  async 'post /switch/:uuid'(req) {
    const perspectiveUuid = req.query?.perspectiveUuid ?? req.params?.uuid ?? req.body?.perspectiveUuid;
    if (!perspectiveUuid) {
      throw new MissingParameterError(loc => loc._c('perspective', 'Perspective UUID'));
    }

    const loc = req.loc;
    const options = { loc, skipNoRowsError: true };
    let perspective = await this.service.getSingleOrNullForUuid(perspectiveUuid, options);
    if (!perspective) {
      throw new HttpError(loc => loc._c('perspective', 'The selected perspective does not exist or you do not have permission to access it.'), 400);
    }

    if (!perspective.isEnabled) {
      throw new HttpError(loc => loc._c('perspective', 'The selected perspective is disabled.'), 403);
    }

    const sessionId = req.session.id;

    const data = {
      count: 1,
      rows: perspective,
      api: {
        data: {
          perspectiveUuid: perspective.uuid,
        },
      },
    };

    const sessionData = await this.sessionDataService.getDataIfExistsForSessionId(sessionId) ?? {};

    sessionData.perspective = perspective;

    await this.sessionDataService.setData(sessionId, sessionData);

    req.log?.info(`Perspective switched to: ${perspective.title}.`, { sessionId, perspectiveName: perspective.name });

    return data;
  }
}