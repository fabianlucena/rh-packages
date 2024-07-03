import { Service } from 'rf-service';
import { CheckError } from 'rf-util';
import { loc } from 'rf-locale';
import { ConflictError } from 'http-util';

export class WfTransitionService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    type: 'wfTypeService',
    from: 'wfStatusService',
    to:   'wfStatusService',
  };
  defaultTranslationContext = 'workflow';

  async validateForCreation(data) {
    if (!data?.typeId) {
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
    const rows = await this.getFor({ title }, { limit: 1 });
    if (rows?.length) {
      throw new ConflictError(loc._f('Exists another row with that title.'));
    }
  }
}