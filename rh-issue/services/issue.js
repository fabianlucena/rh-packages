import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { loc } from 'rf-locale';
import { _ConflictError } from 'http-util';

export class IssueService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  references = {
    project: true,
    type: 'issueTypeService',
    priority: 'issuePriorityService',
    assignee: 'userService',
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

  async getListOptions(options) {
    options = { ...options };

    if (options.include?.Project || options.where?.projectUuid !== undefined) {
      options.include ??= {};
      options.include.Project ??= {
        attributes: ['uuid', 'name', 'title', 'isTranslatable'],
        ...options.include.Project.attributes,
      };
      
      if (options.isEnabled !== undefined) {
        options.include.Project.where = {
          isEnabled: options.isEnabled,
          ...options.include.Project.where,
        };
      }

      if (options.where?.projectUuid !== undefined) {
        options.include.Project.where = {
          uuid: options.where.projectUuid,
          ...options.include.Project?.where,
        };
        delete options.where.projectUuid;
      }
    }

    if (options.include?.Type || options.where?.typeUuid !== undefined) {
      options.include ??= {};
      options.include.Type ??= {
        attributes: ['uuid', 'name', 'title', 'isTranslatable'],
        ...options.include.Type?.attributes,
      };

      if (options.isEnabled !== undefined) {
        options.include.Type.where = {
          isEnabled: options.isEnabled,
          ...options.include.Type.where,
        };
      }

      if (options.where?.typeUuid !== undefined) {
        options.include.Type.where = {
          uuid: options.where.typeUuid,
          ...options.include.Type?.where,
        };
        delete options.where.typeUuid;
      }
    }

    if (options.include?.Priority || options.where?.priorityUuid !== undefined) {
      options.include ??= {};
      options.include.Priority ??= {
        attributes: ['uuid', 'name', 'title', 'isTranslatable'],
        ...options.include.Priority?.attributes,
      };

      if (options.isEnabled !== undefined) {
        options.include.Priority.where = {
          isEnabled: options.isEnabled,
          ...options.include.Priority.where,
        };
      }

      if (options.where?.priorityUuid !== undefined) {
        options.include.Priority.where = {
          uuid: options.where.priorityUuid,
          ...options.include.Priority?.where,
        };
        delete options.where.priorityUuid;
      }
    }

    if (options.include?.Assignee || options.where?.assigneeUuid !== undefined) {
      options.include ??= {};
      options.include.Assignee ??= {
        attributes: ['uuid', 'name', 'title', 'isTranslatable'],
        ...options.include.Assignee?.attributes,
      };

      if (options.isEnabled !== undefined) {
        options.include.Assignee.where = {
          isEnabled: options.isEnabled,
          ...options.include.Assignee.where,
        };
      }

      if (options.where?.assigneeUuid !== undefined) {
        options.include.Assignee.where = {
          uuid: options.where.assigneeUuid,
          ...options.include.Assignee?.where,
        };
        delete options.where.assigneeUuid;
      }
    }

    if (options.include?.CloseReason || options.where?.closeReasonUuid !== undefined) {
      options.include ??= {};
      options.include.closeReasonUuid ??= {
        attributes: ['uuid', 'name', 'title', 'isTranslatable'],
        ...options.include.closeReasonUuid?.attributes,
      };

      if (options.isEnabled !== undefined) {
        options.include.closeReasonUuid.where = {
          isEnabled: options.isEnabled,
          ...options.include.closeReasonUuid.where,
        };
      }

      if (options.where?.closeReasonUuid !== undefined) {
        options.include.closeReasonUuid.where = {
          uuid: options.where.closeReasonUuid,
          ...options.include.closeReasonUuid?.where,
        };
        delete options.where.closeReasonUuid;
      }
    }

    return super.getListOptions(options);
  }
}