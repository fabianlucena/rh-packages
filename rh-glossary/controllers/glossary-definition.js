import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class GlossaryDefinitionController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('glossaryDefinitionService');
    this.glossaryService = dependency.get('glossaryService');
    this.typeService =     dependency.get('glossaryTypeService');
    this.categoryService = dependency.get('glossaryCategoryService');
  }

  postPermission =               'glossary.edit';
  getPermission =                'glossary.edit';
  deleteForUuidPermission =      'glossary.edit';
  postEnableForUuidPermission =  'glossary.edit';
  postDisableForUuidPermission = 'glossary.edit';
  patchForUuidPermission =       'glossary.edit';

  'getPermission /glossary' = 'glossary.edit';
  async 'get /glossary'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    let result = await this.glossaryService.getListAndCount(options);
    result = await this.glossaryService.sanitize(result);

    return result;
  }

  'getPermission /type' = 'glossary.edit';
  async 'get /type'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    let result = await this.typeService.getListAndCount(options);
    result = await this.typeService.sanitize(result);

    return result;
  }

  'getPermission /category' = 'glossary.edit';
  async 'get /category'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    let result = await this.categoryService.getListAndCount(options);
    result = await this.categoryService.sanitize(result);

    return result;
  }
}