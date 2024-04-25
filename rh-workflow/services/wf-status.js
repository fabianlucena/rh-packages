import { ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable } from 'rf-service';
import dependency from 'rf-dependency';

export class WfStatusService extends ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable {
  references = {
    workflowType: 'wfWorkflowTypeService',
  };
  defaultTranslationContext = 'workflow';

  init() {
    this.wfStatusIsInitialService = dependency.get('wfStatusIsInitialService');
    this.wfStatusIsFinalService =   dependency.get('wfStatusIsFinalService');

    super.init();
  }

  async create(data, options) {
    data = { ...data };

    const isInitial = data.isInitial;
    delete data.isInitial;

    const isFinal = data.isFinal;
    delete data.isFinal;

    const result = await super.create(data, options);
    const id = result.id;

    if (isInitial) {
      await this.wfStatusIsInitialService.create({ statusId: id }, options);
    }

    if (isFinal) {
      await this.wfStatusIsFinalService.create({ statusId: id }, options);
    }

    return result;
  }

  async update(data, options) {
    data = { ...data };

    const isInitial = data.isInitial;
    delete data.isInitial;

    const isFinal = data.isFinal;
    delete data.isFinal;

    const result = super.update(data, options);

    if (isInitial !== undefined || isFinal !== undefined) {
      const rows = this.getList({ ...options, attributes: ['id'] });
      const idList = rows.map(r => r.id);

      if (isInitial !== undefined) {
        if (isInitial) {
          for (const id of idList) {
            await this.wfStatusIsInitialService.createIfNotExists({ statusId: id }, options);
          }
        } else {
          await this.wfStatusIsInitialService.deleteFor({ statusId: idList }, options);
        }
      }

      if (isFinal !== undefined) {
        if (isFinal) {
          for (const id of idList) {
            await this.wfStatusIsFinalService.createIfNotExists({ statusId: id }, options);
          }
        } else {
          await this.wfStatusIsFinalService.deleteFor({ statusId: idList }, options);
        }
      }
    }

    return result;
  }

  async delete(options) {
    const rows = this.getList({ ...options, attributes: ['id'] });
    const idList = rows.map(r => r.id);

    await this.wfStatusIsInitialService.deleteFor({ statusId: idList }, options);
    await this.wfStatusIsFinalService.deleteFor({ statusId: idList }, options);

    return super.delete(options);
  }
}