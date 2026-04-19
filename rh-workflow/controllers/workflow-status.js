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

  getPermission    = 'workflow.get';
  postPermission   = 'workflow.create';
  patchPermission  = 'workflow.edit';
  deletePermission = 'workflow.delete';

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

  async delete(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid' };
    let options = { loc };

    options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params, ...req.body },
      definitions,
      options,
    );

    await this.service.delete(options);

    return null;
  }
}