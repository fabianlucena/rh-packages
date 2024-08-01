import { EavAttributeTypeService } from './attribute_type.js';
import { EavAttributeCategoryService } from './attribute_category.js';
import { EavAttributeOptionService } from './attribute_option.js';
import { EavAttributeTagService } from './attribute_tag.js';
import { runSequentially } from 'rf-util';
import { Service } from 'rf-service';
import { ConflictError } from 'http-util';
import { AttributeDefinitionError } from './error.js';

export class EavAttributeService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    type: 'eavAttributeTypeService',
    category: 'eavAttributeCategoryService',
    modelEntityName: {
      service: 'modelEntityNameService',
      createIfNotExists: true,
    }
  };
    
  init() {
    super.init();
        
    this.eavAttributeTypeService =     EavAttributeTypeService.    singleton();
    this.eavAttributeCategoryService = EavAttributeCategoryService.singleton();
    this.eavAttributeOptionService =   EavAttributeOptionService.  singleton();
    this.eavAttributeTagService =      EavAttributeTagService.     singleton();
  }

  async validateForCreation(data) {
    if (!data.typeId) {
      throw new AttributeDefinitionError(loc => loc._c('No type defined for attribute "%s".', data.name));
    }

    const type = await this.eavAttributeTypeService.getSingleNameForId(data.typeId);
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
            throw new AttributeDefinitionError(loc => loc._c('No category defined for attribute "%s".', data.name));
          }
        }

        data = { ...data, categoryId: category.id };
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
      throw new ConflictError(loc => loc._c('eav', 'Exists another attribute with that title for this entity.'));
    }
  }

  async createOrUpdate(data) {
    const [attribute,] = await this.findOrCreate(data);
    const commonData = {
      categoryId: attribute.categoryId,
    };
    await runSequentially(
      data.options,
      async option => await this.eavAttributeOptionService.createIfNotExists({ ...commonData, ...option })
    );

    await runSequentially(
      data.tags,
      async tag => await this.eavAttributeTagService.createIfNotExists({ ...commonData, ...tag })
    );

    return attribute;
  }

  async getForEntityName(entityName, options) {
    return this.getFor({ modelEntityName: { name: entityName }}, options);
  }
}