import { ResourceTypeService } from './resource_type.js';
import { Service } from 'rf-service';
import { checkNotNullNotEmptyAndNotUndefined } from 'rf-util';

export class ResourceService extends Service.IdUuidEnableNameTranslatable {
  references = {
    type: {
      service: 'resourceTypeService',
      otherName: 'resourceType',
    },
    language: true,
  };
  viewAttributes = ['uuid', 'name', 'title', 'content'];
  
  init() {
    super.init();

    this.resourceTypeService = ResourceTypeService.singleton();
  }

  async validateForCreation(data) {
    checkNotNullNotEmptyAndNotUndefined(data.content, loc => loc._c('resource', 'Content'));
    if (!data.typeId) {
      data.typeId = await this.resourceTypeService.getIdForName('raw');
    }

    return super.validateForCreation(data);
  }
}