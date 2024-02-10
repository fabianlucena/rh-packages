import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {CheckError} from 'rf-util';
import {_ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class IssueService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    Sequelize = conf.global.Sequelize;
    sequelize = conf.global.sequelize;
    model = conf.global.models.Issue;
    references = {
        project: conf.global.services.Project.singleton(),
        type: conf.global.services.IssueType.singleton(),
        priority: conf.global.services.IssuePriority.singleton(),
        assignee: conf.global.services.User.singleton(),
        status: conf.global.services.IssueStatus.singleton(),
        workflow: conf.global.services.IssueWorkflow.singleton(),
        closeReason: conf.global.services.IssueCloseReason.singleton(),
    };
    defaultTranslationContext = 'issue';
    eventBus = conf.global.eventBus;

    async validateForCreation(data) {
        if (!data?.projectId) {
            throw new CheckError(loc._cf('issue', 'Project parameter is missing.'));
        }

        return super.validateForCreation(data);
    }

    async checkNameForConflict(name, data) {
        const rows = await this.getFor({name, projectId: data.projectId}, {skipNoRowsError: true});
        if (rows?.length) {
            throw new _ConflictError(loc._cf('issue', 'Exists another issue with that name in this project.'));
        }
    }

    async checkTitleForConflict(title, data, where) {
        const whereOptions = {title};
        const projectId = where?.projectId ?? data?.projectId;
        if (projectId) {whereOptions.projectId = projectId;}
        if (where?.uuid) {whereOptions.uuid = {[conf.global.Sequelize.Op.ne]: where.uuid};}
        const rows = await this.getFor(whereOptions, {limit: 1});
        if (rows?.length) {
            throw new _ConflictError(loc._cf('issue', 'Exists another issue with that title in this project.'));
        }
    }

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
            }
        }

        if (options.includeProject || options.where?.projectUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.projectUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.projectUuid;
                delete options.where.projectUuid;
            }

            const attributes = options.includeProject?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Project',
                {
                    model: conf.global.models.Project,
                    attributes,
                    where,
                }
            );

            delete options.includeProject;
        }

        if (options.includeType || options.where?.typeUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.typeUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.typeUuid;
                delete options.where.typeUuid;
            }

            const attributes = options.includeType?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Type',
                {
                    as: 'Type',
                    model: conf.global.models.IssueType,
                    attributes,
                    where,
                }
            );

            delete options.includeType;
        }

        if (options.includePriority || options.where?.priorityUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.priorityUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.priorityUuid;
                delete options.where.priorityUuid;
            }

            const attributes = options.includePriority?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Priority',
                {
                    as: 'Priority',
                    model: conf.global.models.IssuePriority,
                    attributes,
                    where,
                }
            );

            delete options.includePriority;
        }

        if (options.includeAssignee || options.where?.assigneeUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.assigneeUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.assigneeUuid;
                delete options.where.assigneeUuid;
            }

            const attributes = options.includeAssignee?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Assignee',
                {
                    as: 'Assignee',
                    model: conf.global.models.User,
                    attributes,
                    where,
                }
            );

            delete options.includeAssignee;
        }

        if (options.includeStatus || options.where?.statusUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.statusUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.statusUuid;
                delete options.where.statusUuid;
            }

            const attributes = options.includeStatus?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Status',
                {
                    as: 'Status',
                    model: conf.global.models.IssueStatus,
                    attributes,
                    where,
                }
            );

            delete options.includeStatus;
        }

        if (options.includeWorkflow || options.where?.workflowUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.workflowUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.workflowUuid;
                delete options.where.workflowUuid;
            }

            const attributes = options.includeWorkflow?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'Workflow',
                {
                    as: 'Workflow',
                    model: conf.global.models.IssueWorkflow,
                    attributes,
                    where,
                }
            );

            delete options.includeWorkflow;
        }

        if (options.includeCloseReason || options.where?.closeReasonUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.closeReasonUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.closeReasonUuid;
                delete options.where.closeReasonUuid;
            }

            const attributes = options.includeCloseReason?
                ['uuid', 'name', 'title', 'isTranslatable']:
                [];

            completeIncludeOptions(
                options,
                'CloseReason',
                {
                    as: 'CloseReason',
                    model: conf.global.models.IssueCloseReason,
                    attributes,
                    where,
                }
            );

            delete options.includeCloseReason;
        }

        return super.getListOptions(options);
    }
}