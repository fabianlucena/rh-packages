import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {CheckError} from 'rf-util';
import {loc} from 'rf-locale';

export class IssueTransitionService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.IssueTransition;
    references = {
        workflow: conf.global.services.IssueWorkflow,
        from: conf.global.services.IssueStatus,
        to: conf.global.services.IssueStatus,
    };
    defaultTranslationContext = 'issue';

    async validateForCreation(data) {
        if (!data?.workflowId) {
            throw new CheckError(loc._cf('issue', 'Workflow parameter is missing or workflow does not exist.'));
        }

        if (!data?.fromId) {
            throw new CheckError(loc._cf('issue', 'From parameter is missing or from status does not exist.'));
        }

        if (!data?.toId) {
            throw new CheckError(loc._cf('issue', 'To parameter is missing or to status does not exist.'));
        }

        return super.validateForCreation(data);
    }

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
            }
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
                ['uuid', 'name', 'title']:
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

        if (options.includeFrom || options.where?.fromUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.fromUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.fromUuid;
                delete options.where.fromUuid;
            }

            const attributes = options.includeFrom?
                ['uuid', 'name', 'title']:
                [];

            completeIncludeOptions(
                options,
                'From',
                {
                    as: 'From',
                    model: conf.global.models.IssueStatus,
                    attributes,
                    where,
                }
            );

            delete options.includeFrom;
        }

        if (options.includeTo || options.where?.toUuid !== undefined) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.toUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.toUuid;
                delete options.where.toUuid;
            }

            const attributes = options.includeTo?
                ['uuid', 'name', 'title']:
                [];

            completeIncludeOptions(
                options,
                'To',
                {
                    as: 'To',
                    model: conf.global.models.IssueStatus,
                    attributes,
                    where,
                }
            );

            delete options.includeTo;
        }

        return super.getListOptions(options);
    }
}