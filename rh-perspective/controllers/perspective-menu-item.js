import { Controller } from 'rh-controller';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { getOptionsFromParamsAndOData } from 'http-util';

export class PerspectiveMenuItemController extends Controller {
  constructor() {
    super();

    this.service =            dependency.get('perspectiveMenuItemService');
    this.perspectiveService = dependency.get('perspectiveService');
    this.menuItemService =    dependency.get('menuItemService');
  }

  postPermission =               'perspective.edit';
  getPermission =                'perspective.edit';
  deleteForUuidPermission =      'perspective.edit';
  postEnableForUuidPermission =  'perspective.edit';
  postDisableForUuidPermission = 'perspective.edit';
  patchForUuidPermission =       'perspective.edit';

  'getPermission /perspective' = 'perspective.edit';
  async 'get /perspective'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.perspectiveService.getListAndCount(options);
    result = await this.perspectiveService.sanitize(result);

    return result;
  }

  'getPermission /menu-item' = 'perspective.edit';
  async 'get /menu-item'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 100, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.menuItemService.getListAndCount(options);
    result = await this.menuItemService.sanitize(result);

    return result;
  }
}