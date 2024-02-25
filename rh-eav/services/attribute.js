import {EavAttributeTypeService} from './attribute_type.js';
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
        modelEntityName: {
            service: conf?.global?.services?.ModelEntityName?.singleton(),
            createIfNotExists: true,
        }
    };
    
    constructor() {
        if (!conf?.global?.services?.ModelEntityName?.singleton) {
            throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
        }

        super();
    }

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

        if (options.includeModelEntityName || options.where?.modelEntityName) {
            let attributes = options.includeModelEntityName || [];
            if (attributes === true) {
                attributes = ['uuid', 'name'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.modelEntityName) {
                where = {...where, ...options.where.modelEntityName};
                delete options.where?.modelEntityName;
            }

            completeIncludeOptions(
                options,
                'ModelEntityName',
                {
                    model: conf.global.models.ModelEntityName,
                    attributes,
                    where,
                }
            );
        }
        
        return super.getListOptions(options);
    }

    async getForEntityName(entityName, options) {
        return this.getFor({modelEntityName: {name: entityName}}, options);
    }
}