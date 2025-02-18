import { conf } from '../conf.js';
import { Service, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { ConflictError } from 'http-util';
import dependency from 'rf-dependency';

export class IssueService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    project:     true,
    type:        'issueType',
    priority:    'issuePriority',
    closeReason: 'issueCloseReason',
    relatedTo:   'issueRelated',
    relatedFrom: 'issueRelated',
    assignee:    'user',
  };
  defaultTranslationContext = 'issue';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description', 'dueDate'];
  eventBus = conf.global.eventBus;

  init() {
    super.init();

    this.issueRelatedService =      dependency.get('issueRelatedService');
    this.issueRelationshipService = dependency.get('issueRelationshipService');
  }

  async validateForCreation(data) {
    if (!data?.projectId) {
      throw new CheckError(loc => loc._c('issue', 'Project parameter is missing.'));
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const rows = await this.getFor({ name, projectId: data.projectId }, { skipNoRowsError: true });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('issue', 'Exists another issue with that name in this project.'));
    }
  }

  async checkTitleForConflict(title, data, where) {
    const whereOptions = { title };
    const projectId = where?.projectId ?? data?.projectId;
    if (projectId) {whereOptions.projectId = projectId;}
    if (where?.uuid) {whereOptions.uuid = { [Op.ne]: where.uuid };}
    const rows = await this.getFor(whereOptions, { limit: 1 });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('issue', 'Exists another issue with that title in this project.'));
    }
  }

  async delete(options) {
    await this.issueRelatedService.deleteFor({
      from: { ...options.where }
    });
    await this.issueRelatedService.deleteFor({
      to: { ...options.where },
    });
    return super.delete(options);
  }
}