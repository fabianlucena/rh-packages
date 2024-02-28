import { WfWorkflowTypeService } from './wf-workflow-type.js';
import { WfStatusService } from './wf-status.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {CheckError} from 'rf-util';
import {loc} from 'rf-locale';
import {ConflictError} from 'http-util';

export class WfTransitionService extends ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.WfTransition;
    references = {
        ownerModule:  conf.global.services.Module?.singleton(),
        workflowType: WfWorkflowTypeService.singleton(),
        from:         WfStatusService.singleton(),
        to:           WfStatusService.singleton(),
    };
    defaultTranslationContext = 'workflow';

    async validateForCreation(data) {
        if (!data?.workflowTypeId) {
            throw new CheckError(loc._cf('workflow', 'Workflow type parameter is missing or workflow type does not exist.'));
        }

        if (!data?.fromId) {
            throw new CheckError(loc._cf('workflow', 'From parameter is missing or from status does not exist.'));
        }

        if (!data?.toId) {
            throw new CheckError(loc._cf('workflow', 'To parameter is missing or to status does not exist.'));
        }

        return super.validateForCreation(data);
    }

    async checkNameForConflict(title) {
        const rows = await this.getFor({title}, {limit: 1});
        if (rows?.length) {
            throw new ConflictError(loc._f('Exists another row with that title.'));
        }
    }

    async getListOptions(options) {
        options ??= {};

        if (options.includeWorkflowType
            || options.where?.workflowType
            || options.where?.workflowTypeName
            || options.where?.workflowTypeUuid
        ) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.workflowType !== undefined) {
                where ??= {};
                where.name = options.where.workflowType;
                delete options.where.workflowType;
            }

            if (options.where?.workflowTypeName !== undefined) {
                where ??= {};
                where.uuid = options.where.workflowTypeName;
                delete options.where.workflowTypeName;
            }

            if (options.where?.workflowTypeUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.workflowTypeUuid;
                delete options.where.workflowTypeUuid;
            }

            const attributes = options.includeWorkflowType?
                ['uuid', 'name', 'title']:
                [];

            completeIncludeOptions(
                options,
                'WorkflowType',
                {
                    as: 'WorkflowType',
                    model: conf.global.models.WfWorkflowType,
                    attributes,
                    where,
                }
            );

            delete options.includeWorkflow;
        }

        if (options.includeFrom
            || options.where?.from
            || options.where?.fromName
            || options.where?.fromUuid
        ) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.from !== undefined) {
                where ??= {};
                where.name = options.where.from;
                delete options.where.from;
            }

            if (options.where?.fromName !== undefined) {
                where ??= {};
                where.name = options.where.fromName;
                delete options.where.fromName;
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
                    model: conf.global.models.WfStatus,
                    attributes,
                    where,
                }
            );

            delete options.includeFrom;
        }

        if (options.includeTo
            || options.where?.to
            || options.where?.toName
            || options.where?.toUuid
        ) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.to !== undefined) {
                where ??= {};
                where.name = options.where.to;
                delete options.where.to;
            }

            if (options.where?.toName !== undefined) {
                where ??= {};
                where.name = options.where.toName;
                delete options.where.toName;
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
                    model: conf.global.models.WfStatus,
                    attributes,
                    where,
                }
            );

            delete options.includeTo;
        }

        return super.getListOptions(options);
    }
}