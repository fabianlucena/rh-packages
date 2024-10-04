import { Service } from 'rf-service';
import { checkParameterNotNullOrEmpty } from 'rf-util';
import { ConflictError } from 'http-util';

export class EavAttributeTagService extends Service.IdUuidEnableNameOwnerModuleTranslatable {
  references = {
    category: 'eavAttributeCategoryService',
  };

  async validateForCreation(data) {
    checkParameterNotNullOrEmpty(data.categoryId, loc => loc._c('eav', 'Category'));
    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    if (await this.getSingleOrNullForName(name, { where: { categoryId: data.categoryId }, skipNoRowsError: true })) {
      throw new ConflictError(loc => loc._c('eav', 'Exists another tag with that name.'));
    }
  }
}