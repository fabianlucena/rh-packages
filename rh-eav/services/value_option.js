import { ServiceIdUuidTranslatable } from 'rf-service';
import { _Error } from 'rf-util';
import { loc } from 'rf-locale';

export class EavValueOptionService extends ServiceIdUuidTranslatable {
  references = {
    attribute: 'eavAttributeService',
    option: 'eavAttributeOptionService',
    modelEntityName: true,
  };

  async delete(options) {
    if (!options.where) {
      throw new Error(loc._cf('eav', 'Delete without where is forbiden.'));
    }

    if (options.where.notId) {
      if (!this.Sequelize?.Op) {
        throw new _Error(loc._f('No Sequalize.Op defined on %s. Try adding "Sequelize = conf.global.Sequelize" to the class.', this.constructor.name));
      }

      const Op = this.Sequelize.Op;
      const where = options.where;
      const filters = where[Op.and] ??= [];

      if (where.id) {
        filters.push({ id: options.where.id });
        delete options.where.id;
      }

      if (where.notId) {
        let notId = where.notId;
        if (!Array.isArray(notId)) {
          notId = [notId];
        }

        filters.push({ id: { [Op.notIn]: notId }});
        delete options.where.notId;
      }

      if (filters.length) {
        options.where ||= {};
        options.where[Op.and] = filters;
      }
    }

    return super.delete(options);
  }

  async updateValue(data, options) {
    if (!data.attributeId) {
      throw new _Error(loc._f('Cannot update option value because attributeId data is missing or empty'));
    }

    if (!data.entityId) {
      throw new _Error(loc._f('Cannot update option value because entityId data is missing or empty'));
    }

    let valueId;
    const serviceData = {
      attributeId: data.attributeId,
      entityId: data.entityId,
      optionUuid: data.value,
    };

    if (data.value) {
      data.optionUuid = data.value;
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