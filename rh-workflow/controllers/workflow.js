import dependency from 'rf-dependency';
import { Controller } from 'rh-controller';

export class WorkflowController extends Controller {
  constructor() {
    super();

    this.service = dependency.get('wfWorkflowService');
  }

  getPermission = 'workflow.get';
}