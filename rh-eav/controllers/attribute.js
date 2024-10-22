import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class AttributeController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('eavAttributeService');
    this.typeService =     dependency.get('eavAttributeTypeService');
    this.categoryService = dependency.get('eavAttributeCategoryService');
    this.entityService =   dependency.get('modelEntityNameService');
  }

  getPermission =          'eavAttribute.get';
  postPermission =         'eavAttribute.create';
  patchForUuidPermission = 'eavAttribute.edit';

  'getPermission /type' = 'eavAttribute.edit';
  async 'get /type'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    return this.typeService.getListAndCount(options);
  }

  'getPermission /entity' = 'eavAttribute.edit';
  async 'get /entity'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    return this.entityService.getListAndCount(options);
  }

  'getPermission /category' = 'eavAttribute.edit';
  async 'get /category'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    return this.categoryService.getListAndCount(options);
  }
}