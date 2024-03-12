import {WfWorkflowTypeService} from './wf-workflow-type.js';
import {WfStatusIsInitialService} from './wf-status-is-initial.js';
import {WfStatusIsFinalService} from './wf-status-is-final.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable} from 'rf-service';

export class WfStatusService extends ServiceIdUuidNameTitleDescriptionEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.WfStatus;
    references = {
        ownerModule: conf.global.services.Module?.singleton(),
        workflowType: WfWorkflowTypeService.singleton(),
    };
    defaultTranslationContext = 'workflow';

    init() {
        this.wfStatusIsInitialService = WfStatusIsInitialService.singleton();
        this.wfStatusIsFinalService =   WfStatusIsFinalService.singleton();
    }

    async create(data, options) {
        data = {...data};

        const isInitial = data.isInitial;
        delete data.isInitial;

        const isFinal = data.isFinal;
        delete data.isFinal;

        const result = await super.create(data, options);
        const id = result.id;

        if (isInitial) {
            await this.wfStatusIsInitialService.create({statusId: id}, options);
        }

        if (isFinal) {
            await this.wfStatusIsFinalService.create({statusId: id}, options);
        }

        return result;
    }

    async update(data, options) {
        data = {...data};

        const isInitial = data.isInitial;
        delete data.isInitial;

        const isFinal = data.isFinal;
        delete data.isFinal;

        const result = super.update(data, options);

        if (isInitial !== undefined || isFinal !== undefined) {
            const rows = this.getList({...options, attributes: ['id'], raw: true});
            const idList = rows.map(r => r.id);

            if (isInitial !== undefined) {
                if (isInitial) {
                    for (const id of idList) {
                        await this.wfStatusIsInitialService.createIfNotExists({statusId: id}, options);
                    }
                } else {
                    await this.wfStatusIsInitialService.deleteFor({statusId: idList}, options);
                }
            }

            if (isFinal !== undefined) {
                if (isFinal) {
                    for (const id of idList) {
                        await this.wfStatusIsFinalService.createIfNotExists({statusId: id}, options);
                    }
                } else {
                    await this.wfStatusIsFinalService.deleteFor({statusId: idList}, options);
                }
            }
        }

        return result;
    }

    async delete(options) {
        const rows = this.getList({...options, attributes: ['id'], raw: true});
        const idList = rows.map(r => r.id);

        await this.wfStatusIsInitialService.deleteFor({statusId: idList}, options);
        await this.wfStatusIsFinalService.deleteFor({statusId: idList}, options);

        return super.delete(options);
    }
}