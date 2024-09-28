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
  };
  defaultTranslationContext = 'issue';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
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

  async autoRelatedForId(id) {
    const issue = await this.getSingleForId(id);
    const criteria = [];
    for (const word of issue.description?.split(/[\s.,;:]+/) ?? []) {
      if (word.length < 2) {
        continue;
      }

      criteria.push({ [Op.like]: `%${word}%` });
    }
    if (!criteria.length) {
      return;
    }

    const candidates = await this.getFor({
      id: { [Op.ne]: id },
      description: { [Op.or]: criteria },
    });
    if (!candidates.length) {
      return;
    }

    const relationshipId = await this.issueRelationshipService.getSingleIdForName('related');

    for (const candidate of candidates) {
      await this.issueRelatedService.create({
        fromId: id,
        toId:   candidate.id,
        relationshipId,
      });     
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