import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class GlossaryController extends Controller {
  constructor() {
    super();

    this.service =           dependency.get('glossaryService');
    this.projectService =    dependency.get('projectService',    null);
    this.getCurrentProject = dependency.get('getCurrentProject', null);
  }

  postPermission =               'glossary.create';
  getPermission =                'glossary.get';
  deleteForUuidPermission =      'glossary.delete';
  postEnableForUuidPermission =  'glossary.edit';
  postDisableForUuidPermission = 'glossary.edit';
  patchForUuidPermission =       'glossary.edit';

  'getPermission /project' = [ 'glossary.create', 'glossary.edit' ];
  async 'get /project'(req, res) {
    if (!this.projectService) {
      if (!res.headersSent) {
        res.status(404).send({ error: 'Not found.' });
      }
    }

    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    const result = await this.projectService.getListAndCount(options);

    return result;
  }
}