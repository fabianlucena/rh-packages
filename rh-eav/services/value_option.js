import { Service, Op } from 'rf-service';
import { _Error } from 'rf-util';
import { loc } from 'rf-locale';

export class EavValueOptionService extends Service.IdUuidTranslatable {
  references = {
    attribute:       'eavAttributeService',
    option:          'eavAttributeOptionService',
    modelEntityName: true,
  };

  async delete(options) {
    if (!options.where) {
      throw new Error(loc._cf('eav', 'Delete without where is forbiden.'));
    }

    const where = options.where;
    if (where.id || where.notId) {
      const filters = where[Op.and] ??= [];

      if (where.id) {
        filters.push({ id: where.id });
        delete where.id;
      }

      if (where.notId) {
        let notId = where.notId;
        if (!Array.isArray(notId)) {
          notId = [notId];
        }

        filters.push({ id: { [Op.notIn]: notId }});
        delete where.notId;
      }
    }

    return super.delete(options);
  }

  async updateValue(data, options) {
    if (!data.attributeId) {
      throw new _Error(loc._cf('eav', 'Cannot update option value because attributeId data is missing or empty'));
    }

    if (!data.entityId) {
      throw new _Error(loc._cf('eav', 'Cannot update option value because entityId data is missing or empty'));
    }

    let valueId;
    const serviceData = {
      attributeId: data.attributeId,
      entityId: data.entityId,
      option: { uuid: data.value },
    };

    if (data.value) {
      data.option = { uuid: data.value };
      const result = await this.getFor(serviceData, options);
      if (!result?.length) {
        const inserted = await this.create(serviceData, options);
        valueId = inserted.id;
      } else {
        valueId = result[0].id;
      }
    } else {
      valueId = [];
    }

    serviceData.notId = valueId;

    await this.deleteFor(serviceData);
  }
}