import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { _Error } from 'rf-util';
import { loc } from 'rf-locale';

export class EavValueTextService extends Service.IdUuid {
  references = {
    attribute: 'eavAttributeService',
    modelEntityName: true,
  };

  async updateValue(data, options) {
    if (!data.attributeId) {
      throw new _Error(loc._f('Cannot update option value because attributeId data is missing or empty'));
    }
        
    if (!data.entityId) {
      throw new _Error(loc._f('Cannot update option value because entityId data is missing or empty'));
    }

    const serviceData = {
      attributeId: data.attributeId,
      entityId: data.entityId,
    };

    const result = await conf.eavValueTextService.getFor(serviceData, options);
    if (!result?.length) {
      await conf.eavValueTextService.create({ ...serviceData, value: data.value }, options);
    } else {
      const valueId = result[0].id;
      await conf.eavValueTextService.updateForId({ value: data.value }, valueId, options);
    }
  }
}