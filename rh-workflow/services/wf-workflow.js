import {WfWorkflowTypeService} from './wf-workflow-type.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class WfWorkflowService extends ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.WfWorkflow;
    moduleService = conf.global.services.Module.singleton();
    references = {
        modelEntityName: conf?.global?.services?.ModelEntityName?.singleton(),
        workflowType: WfWorkflowTypeService.singleton(),
    };
    defaultTranslationContext = 'workflow';
    translatableColumns = [
        'title',
        'description',
        'currentStatusTitle',
        'asigneeTitle',
        'workflowTitle',
    ];

    constructor() {
        if (!conf.global.services.ModelEntityName?.singleton) {
            throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
        }

        super();
    }

    async getListOptions(options) {
        options = {...options};

        if (options.includeModelEntityName
            || options.where?.modelEntityName
        ) {
            let attributes = options.includeModelEntityName || [];
            if (attributes === true) {
                attributes = ['uuid', 'name'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.modelEntityName) {
                where = {...where, ...options.where.modelEntityName};
                delete options.where?.modelEntityName;
            }

            completeIncludeOptions(
                options,
                'ModelEntityName',
                {
                    model: conf.global.models.ModelEntityName,
                    attributes,
                    where,
                }
            );
        }
        
        return super.getListOptions(options);
    }

    async getForEntityName(entityName, options) {
        return this.getFor({modelEntityName: {name: entityName}}, options);
    }
}