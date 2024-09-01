import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { UpdateAttributeValueError } from './error.js';

export class EavValueNumberService extends Service.IdUuid {
  references = {
    attribute: 'eavAttributeService',
    modelEntityName: true,
  };

  async updateValue(data, options) {
    if (!data.attributeId) {
      throw new UpdateAttributeValueError(loc => loc._c('eav', 'Cannot update option value because attributeId data is missing or empty'));
    }
        
    if (!data.entityId) {
      throw new UpdateAttributeValueError(loc => loc._c('eav', 'Cannot update option value because entityId data is missing or empty'));
    }

    const serviceData = {
      attributeId: data.attributeId,
      entityId: data.entityId,
    };

    const result = await conf.eavValueNumberService.getFor(serviceData, options);
    if (!result?.length) {
      await conf.eavValueNumberService.create({ ...serviceData, value: data.value }, options);
    } else {
      const valueId = result[0].id;
      await conf.eavValueNumberService.updateForId({ value: data.value }, valueId, options);
    }
  }
}