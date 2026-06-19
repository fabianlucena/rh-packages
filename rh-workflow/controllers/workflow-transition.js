import { getOptionsFromParamsAndOData } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';
import { Controller } from 'rh-controller';

export class WorkflowTransitionController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('wfTransitionService');
    this.statusService =   dependency.get('wfStatusService');
    this.workflowService = dependency.get('wfWorkflowService');
  }

  getPermission = 'workflow.get';

  postPermission = 'workflow.create';
  async post(req) {
    const loc = req.loc ?? defaultLoc;
    const data = { ...req.body, loc };

    const fromUuid = req.body.from?.uuid ?? req.body['from.uuid'];
    if (fromUuid) {
      const fromStatus = await this.statusService.getSingleFor({ uuid: fromUuid });
      data.fromId = fromStatus.id;
    }

    const toUuid = req.body.to?.uuid ?? req.body['to.uuid'];
    if (toUuid) {
      const toStatus = await this.statusService.getSingleFor({ uuid: toUuid });
      data.toId = toStatus.id;
    }

    const workflowUuid = req.body.workflow?.uuid ?? req.body['workflow.uuid'] ?? req.body.workflowUuid;
    if (workflowUuid) {
      const workflow = await this.workflowService.getSingleFor({ uuid: workflowUuid });
      data.workflowId = workflow.id;
    }

    const result = await this.service.create(data);
    return this.service.sanitize([result]);
  }

  'getPermission /status' = ['workflow.create', 'workflow.edit'];
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