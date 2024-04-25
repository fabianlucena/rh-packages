import { ResourceTypeService } from './resource_type.js';
import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';
import { checkNotNullNotEmptyAndNotUndefined } from 'rf-util';
import { loc } from 'rf-locale';

export class ResourceService extends ServiceIdUuidNameEnabledTranslatable {
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
    checkNotNullNotEmptyAndNotUndefined(data.content, loc._cf('resource', 'Content'));
    if (!data.typeId) {
      data.typeId = await this.resourceTypeService.getIdForName('raw');
    }

    return super.validateForCreation(data);
  }
}