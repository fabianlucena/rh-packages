import { getOptionsFromParamsAndOData, HttpError } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';

export class WorkflowCaseController extends Controller {
  constructor() {
    super();

    this.service =                dependency.get('wfCaseService');
    this.workflowService =        dependency.get('wfWorkflowService');
    this.transitionService =      dependency.get('wfTransitionService');
    this.branchService =          dependency.get('wfBranchService');
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

  'postPermission /do-transition' = 'workflow.edit';
  async 'post /do-transition'(req) {
    const loc = loc ?? defaultLoc;
    const wfCaseWhere = req.body?.case;

    if (!wfCaseWhere) {
      throw new HttpError(loc => loc._c('workflow', 'Case missing from request'), 400);
    }

    const transitionWhere = req.body?.transition;

    if (!transitionWhere) {
      throw new HttpError(loc => loc._c('workflow', 'Transition missing from request'), 400);
    }

    const wfCase = await this.service.getSingle({ where: wfCaseWhere });
    const transition = await this.transitionService.getSingle({ where:transitionWhere });

    if (wfCase.workflowId !== transition.workflowId) {
      throw new HttpError(loc => loc._c('workflow', 'Transition does not belong to workflow'), 400);
    }

    await this.branchService.updateFor({ statusId: transition.toId }, { caseId: wfCase.id });
  } 
}