import { getOptionsFromParamsAndOData } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';

export class WorkflowStatusController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('wfStatusService');
    this.workflowService = dependency.get('wfWorkflowService');
  }

  getPermission = 'workflow.get';

  'getPermission /workflow' = [ 'workflow.create', 'workflow.edit' ];
  async 'get /workflow'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    let result = await this.workflowService.getListAndCount(options);
    result = await this.workflowService.sanitize(result);

    return result;
  }
}