import { Service } from 'rf-service';
import { checkParameterNotNullOrEmpty } from 'rf-util';
import { loc } from 'rf-locale';
import { _ConflictError } from 'http-util';

export class EavAttributeTagService extends Service.IdUuidEnableNameOwnerModuleTranslatable {
  references = {
    attribute: 'eavAttributeService',
  };

  async validateForCreation(data) {
    checkParameterNotNullOrEmpty(data.attributeId, loc._cf('eav', 'Attribute'));
    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    if (await this.getForName(name, { where: { attributeId: data.attributeId }, skipNoRowsError: true })) {
      throw new _ConflictError(loc._cf('eav', 'Exists another tag with that name.'));
    }
  }
}