import { ServiceIdUuidNameTitleEnabledTranslatable } from 'rf-service';

export class ModuleService extends ServiceIdUuidNameTitleEnabledTranslatable {
  async validateForCreation(data) {
    data.title ??= data.name;
    return super.validateForCreation(data);
  }
}