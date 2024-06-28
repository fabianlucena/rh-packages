import { Service } from 'rf-service';

export class ModuleService extends Service.IdUuidEnableNameUniqueTitleTranslatable {
  async validateForCreation(data) {
    data.title ??= data.name;
    return super.validateForCreation(data);
  }
}