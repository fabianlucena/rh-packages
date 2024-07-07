import { Service } from 'rf-service';
import { checkParameterNotNullOrEmpty } from 'rf-util';
import { ConflictError } from 'http-util';

export class EavAttributeTagService extends Service.IdUuidEnableNameOwnerModuleTranslatable {
  references = {
    attribute: 'eavAttributeService',
  };

  async validateForCreation(data) {
    checkParameterNotNullOrEmpty(data.attributeId, loc => loc._c('eav', 'Attribute'));
    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    if (await this.getForName(name, { where: { attributeId: data.attributeId }, skipNoRowsError: true })) {
      throw new ConflictError(loc => loc._c('eav', 'Exists another tag with that name.'));
    }
  }
}