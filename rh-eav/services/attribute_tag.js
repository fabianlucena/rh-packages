import {EavAttributeService} from './attribute.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledModuleTranslatable} from 'rf-service';
import {checkParameterNotNullOrEmpty} from 'rf-util';
import {loc} from 'rf-locale';
import {_ConflictError} from 'http-util';
import {completeIncludeOptions} from 'sql-util';

export class EavAttributeTagService extends ServiceIdUuidNameEnabledModuleTranslatable {
    sequelize = conf.global.sequelize;
    Sequelize = conf.global.Sequelize;
    model = conf.global.models.EavAttributeTag;
    references = {
        attribute: EavAttributeService.singleton(),
        ownerModule: conf.global.services.Module?.singleton(),
    };

    async validateForCreation(data) {
        checkParameterNotNullOrEmpty(data.attributeId, loc._cf('eav', 'Attribute'));
        return super.validateForCreation(data);
    }

    async checkNameForConflict(name, data) {
        if (await this.getForName(name, {where: {attributeId: data.attributeId}, skipNoRowsError: true})) {
            throw new _ConflictError(loc._cf('eav', 'Exists another tag with that name.'));
        }
    }

    async getListOptions(options) {
        if (options.includeEavAttribute || options?.where?.attribute || options?.where?.attributeUuid) {
            let attributes;
            if (options.includeEavAttribute) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
                delete options.includeEavAttribute;
            } else {
                attributes = [];
            }

            const EavAttributeOptions = {
                model: conf.global.models.EavAttribute,
                attributes,
            };

            if (options?.where?.attribute) {
                EavAttributeOptions.where ??= {};
                EavAttributeOptions.where.name = options.where.attribute;
                delete options.where.attribute;
            }

            if (options?.where?.attributeUuid) {
                EavAttributeOptions.where ??= {};
                EavAttributeOptions.where.uuid = options.where.attributeUuid;
                delete options.where.attributeUuid;
            }

            completeIncludeOptions(
                options,
                'EavAttribute',
                EavAttributeOptions,
            );
        }

        return super.getListOptions(options);
    }
}