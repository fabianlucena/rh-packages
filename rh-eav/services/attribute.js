import { EavAttributeTypeService } from './attribute_type.js';
import { EavAttributeCategoryService } from './attribute_category.js';
import { EavAttributeOptionService } from './attribute_option.js';
import { EavAttributeTagService } from './attribute_tag.js';
import { conf } from '../conf.js';
import { runSequentially, _Error } from 'rf-util';
import { loc } from 'rf-locale';
import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';
import { completeIncludeOptions } from 'sql-util';
import { ConflictError } from 'http-util';

export class EavAttributeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.EavAttribute;
    references = {
        type: EavAttributeTypeService.singleton(),
        category: EavAttributeCategoryService.singleton(),
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
        this.eavAttributeTypeService =     EavAttributeTypeService.    singleton();
        this.eavAttributeCategoryService = EavAttributeCategoryService.singleton();
        this.eavAttributeOptionService =   EavAttributeOptionService.  singleton();
        this.eavAttributeTagService =      EavAttributeTagService.     singleton();
    }

    async validateForCreation(data) {
        if (!data.typeId) {
            throw new _Error(loc._cf('No type defined for attribute "%s".', data.name));
        }

        const type = await this.eavAttributeTypeService.getNameForId(data.typeId);
        if (type === 'select' || type === 'tags') {
            if (!data.categoryId) {
                let category = await this.eavAttributeCategoryService.getSingleOrNullForName(data.name);
                if (!category) {
                    category = await this.eavAttributeCategoryService.create({
                        name: data.name,
                        title: data.title,
                        isTranaslatable: data.isTranaslatable,
                        translationContext: data.translationContext,
                        description: data.description,
                    });
                
                    if (!category) {
                        throw new _Error(loc._cf('No category defined for attribute "%s".', data.name));
                    }
                }

                data = {...data, categoryId: category.id};
            }        
        }

        return super.validateForCreation(data); 
    }

    async checkTitleForConflict(title, data) {
        const rows = await this.getFor(
            {
                title,
                modelEntityNameId: data.modelEntityNameId,
            },
            {
                limit: 1,
            }
        );
        if (rows?.length) {
            throw new ConflictError(loc._f('Exists another attribute with that title for this entity.'));
        }
    }

    async createOrUpdate(data) {
        const attribute = await this.createIfNotExists(data);
        const commonData = {
            categoryId: attribute.categoryId,
        };
        await runSequentially(
            data.options,
            async option => await this.eavAttributeOptionService.createIfNotExists({...commonData, ...option})
        );

        await runSequentially(
            data.tags,
            async tag => await this.eavAttributeTagService.createIfNotExists({...commonData, ...tag})
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
                    as: 'Type',
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