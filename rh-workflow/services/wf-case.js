import {WfWorkflowService} from './wf-workflow.js';
import {conf} from '../conf.js';
import {ServiceBase} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class WfCaseService extends ServiceBase {
    sequelize = conf.global.sequelize;
    model = conf.global.models.WfCase;
    references = {
        workflow: WfWorkflowService.singleton(),
    };
    defaultTranslationContext = 'workflow';

    async getListOptions(options) {
        options = {...options};

        if (options.includeCurrentStatus
            || options.includeStatus
            || options.includeAssignee
        ) {
            const include = [];
            if (options.includeStatus) {
                include.push({
                    model: conf.global.models.WfStatus,
                    as: 'Status',
                });
            }

            if (options.includeAssignee) {
                include.push({
                    model: conf.global.models.User,
                    as: 'Assignee',
                });
            }

            completeIncludeOptions(
                options,
                'Case',
                {
                    model: conf.global.models.WfCurrentStatus,
                    as: 'CurrentStatus',
                    include,
                },
            );
        }
        
        return super.getListOptions(options);
    }
}