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
    this.wfCaseLogService = dependency.get('wfCaseLogService');
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

  async create(data, options) {
    if (!options?.transaction || options?.transaction === true) {
      options ??= {};
      options.transaction = await this.createTransaction();
    }

    try {
      data = await this.completeReferences(data, options);
      await super.create(data, options);
      await this.wfCaseLogService.create({
        caseId: data.caseId,
        statusId: data.statusId,
        assigneeId: data.assigneeId,
        operatorId: null, // TODO: Actually get the user executing the request
      });
      await options.transaction.commit();
    } catch (error) {
      await options.transaction.rollback();

      await this.pushError(error);

      throw error;
    }
  }

  async update(data, options) {
    data = await this.completeReferences(data, options);
    const branches = await this.getList({ ...options, attributes: ['caseId', 'statusId', 'assigneeId'] });
    for (const branch of branches) {
      if (branch.statusId === data.statusId && branch.assignee === data.assignee) continue;
      await this.wfCaseLogService.create({
        caseId: branch.caseId,
        statusId: 'statusId' in data ? data.statusId : branch.statusId,
        assigneeId: 'assigneeId' in data ? data.assigneeId : branch.assigneeId,
        operatorId: null, // TODO: Actually get the user executing the request
      });
    }
    return super.update(data, options);
  }
}