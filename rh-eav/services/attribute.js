import {EavAttributeTypeService} from './attribute_type.js';
import {EavEntityTypeService} from './entity_type.js';
import {EavAttributeOptionService} from './attribute_option.js';
import {conf} from '../conf.js';
import {runSequentially} from 'rf-util';
import {ServiceIdUuidNameTitleDescriptionEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class EavAttributeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavAttribute;
    references = {
        attributeType: {
            service: EavAttributeTypeService.singleton(),
            otherName: 'type',
        },
        entityType: {
            service: EavEntityTypeService.singleton(),
            createIfNotExists: true,
        }
    };

    init() {
        this.eavAttributeOptionService = EavAttributeOptionService.singleton();
    }

    async createOrUpdate(data) {
        const attribute = await this.createIfNotExists(data);
        const attributeId = attribute.id;
        await runSequentially(
            data.options,
            async data => await this.eavAttributeOptionService.createIfNotExists({attributeId, ...data})
        );

        return attribute;
    }

    async getListOptions(options) {
        options ||= {};

        if (options.includeAttributeType || options.where?.attributeType) {
            let attributes = options.includeAttributeType || [];
            if (attributes === true) {
                attributes = ['uuid', 'name', 'title', 'isTranslatable'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.attributeType) {
                where = {...where, ...options.where.attributeType};
                delete options.where?.attributeType;
            }

            completeIncludeOptions(
                options,
                'EavAttributeType',
                {
                    model: conf.global.models.EavAttributeType,
                    attributes,
                    where,
                }
            );
        }

        if (options.includeEntityType || options.where?.entityType) {
            let attributes = options.includeEntityType || [];
            if (attributes === true) {
                attributes = ['uuid', 'name'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.entityType) {
                where = {...where, ...options.where.entityType};
                delete options.where?.entityType;
            }

            completeIncludeOptions(
                options,
                'EavEntityType',
                {
                    model: conf.global.models.EavEntityType,
                    attributes,
                    where,
                }
            );
        }
        
        return super.getListOptions(options);
    }

    async getForEntityName(entityName, options) {
        return this.getFor({entityType: {name: entityName}}, options);
    }
}