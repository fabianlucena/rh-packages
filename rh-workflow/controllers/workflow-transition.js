import { getOptionsFromParamsAndOData } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';

export class WorkflowTransitionController extends Controller {
  constructor() {
    super();

    this.service =       dependency.get('wfTransitionService');
    this.statusService = dependency.get('wfStatusService');
  }

  getPermission = 'workflow.get';

  'getPermission /status' = [ 'workflow.create', 'workflow.edit' ];
  async 'get /status'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.statusService.getListAndCount(options);
    result = await this.statusService.sanitize(result);

    return result;
  }
}