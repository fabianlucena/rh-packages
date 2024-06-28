import { Service } from 'rf-service';

export class EavAttributeCategoryService extends Service.IdUuidNameUniqueTitleDescriptionTranslatable {
  async checkTitleForConflict() {
    return true;
  }
}