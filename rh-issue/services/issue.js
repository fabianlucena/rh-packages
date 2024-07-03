import { conf } from '../conf.js';
import { Service, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { loc } from 'rf-locale';
import { _ConflictError } from 'http-util';

export class IssueService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    project:     true,
    type:        'issueTypeService',
    priority:    'issuePriorityService',
    workflow:    'wfWorkflowService',
    status:      'wfStatusService',
    assignee:    'userService',
    closeReason: 'issueCloseReasonService',
  };
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
  eventBus = conf.global.eventBus;

  async validateForCreation(data) {
    if (!data?.projectId) {
      throw new CheckError(loc._cf('issue', 'Project parameter is missing.'));
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const rows = await this.getFor({ name, projectId: data.projectId }, { skipNoRowsError: true });
    if (rows?.length) {
      throw new _ConflictError(loc._cf('issue', 'Exists another issue with that name in this project.'));
    }
  }

  async checkTitleForConflict(title, data, where) {
    const whereOptions = { title };
    const projectId = where?.projectId ?? data?.projectId;
    if (projectId) {whereOptions.projectId = projectId;}
    if (where?.uuid) {whereOptions.uuid = { [Op.ne]: where.uuid };}
    const rows = await this.getFor(whereOptions, { limit: 1 });
    if (rows?.length) {
      throw new _ConflictError(loc._cf('issue', 'Exists another issue with that title in this project.'));
    }
  }
}