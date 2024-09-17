import dependency from 'rf-dependency';
import { Service } from 'rf-service';

export class WfBranchService extends Service.Translatable {
  references = {
    case:     'wfCase',
    status:   'wfStatus',
    assignee: 'user',
  };
  defaultTranslationContext = 'workflow';

  init() {
    super.init();
    this.wfStatusService = dependency.get('wfStatusService');
  }

  async createForWorkflowIdAndCaseId(workflowId, caseId) {
    const statuses = await this.wfStatusService.getFor({
      workflowId,
    }, {
      include: { isInitial: { required: true }},
    });

    const branches = [];
    for (const status of statuses) {
      const branch = await this.create({
        caseId,
        statusId: status.id,
      });

      branches.push(branch);
    }

    return branches;
  };

  async getForCaseId(caseId) {
    return await this.getFor({
      caseId,
    }, {
      include: {
        status:   true,
        assignee: true,
      },
    });
  }
}