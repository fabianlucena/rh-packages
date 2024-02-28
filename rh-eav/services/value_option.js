import {EavAttributeService} from './attribute.js';
import {EavAttributeOptionService} from './attribute_option.js';
import {conf} from '../conf.js';
import {ServiceIdUuidTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';
import {_Error} from 'rf-util';
import {loc} from 'rf-locale';

export class EavValueOptionService extends ServiceIdUuidTranslatable {
    Sequelize = conf.global.Sequelize;
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavValueOption;
    references = {
        attribute: EavAttributeService.singleton(),
        attributeOption: EavAttributeOptionService.singleton(),
    };

    constructor() {
        if (!conf?.global?.services?.ModelEntityName?.singleton) {
            throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
        }

        super();
    }

    async getListOptions(options) {
        options ||= {};

        if (options.includeAttributeOption || options.where?.attributeOptionUuid) {
            let attributes = options.includeAttributeOption || [];
            if (attributes === true) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable', 'translationContext', 'description'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.attributeOptionUuid) {
                where = {...where, uuid: options.where.attributeOptionUuid};
                delete options.where?.attributeOptionUuid;
            }
    
            completeIncludeOptions(
                options,
                'EavAttributeOption',
                {
                    model: conf.global.models.EavAttributeOption,
                    attributes,
                    where,
                }
            );
        }

        return super.getListOptions(options);
    }

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
                filters.push({id: options.where.id});
                delete options.where.id;
            }

            if (where.notId) {
                let notId = where.notId;
                if (!Array.isArray(notId)) {
                    notId = [notId];
                }

                filters.push({id: {[Op.notIn]: notId}});
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
            attributeOptionUuid: data.value,
        };

        if (data.value) {
            data.attributeOptionUuid = data.value;
            const result = await conf.eavValueOptionService.getFor(serviceData, options);
            if (!result?.length) {
                const inserted = await conf.eavValueOptionService.create(serviceData, options);
                valueId = inserted.id;
            } else {
                valueId = result[0].id;
            }
        } else {
            valueId = [];
        }

        serviceData.notId = valueId;

        await conf.eavValueOptionService.deleteFor(serviceData);
    }
}