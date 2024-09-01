import { EavAttributeTypeService } from './attribute_type.js';
import { EavAttributeCategoryService } from './attribute_category.js';
import { EavAttributeOptionService } from './attribute_option.js';
import { EavAttributeTagService } from './attribute_tag.js';
import { runSequentially } from 'rf-util';
import { Service } from 'rf-service';
import { ConflictError } from 'http-util';
import { AttributeDefinitionError } from './error.js';
import { defaultLoc } from 'rf-locale';

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

  async getInterface(req) {
    const gridActions = [];
    if (req.permissions.includes('eavAttribute.create')) gridActions.push('create');
    if (req.permissions.includes('eavAttribute.edit'))   gridActions.push('enableDisable', 'edit');
    if (req.permissions.includes('eavAttribute.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       await loc._c('eav', 'Enabled'),
        placeholder: await loc._c('eav', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       await loc._c('eav', 'Title'),
        placeholder: await loc._c('eav', 'Type the title here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        onValueChanged: {
          mode: {
            create:       true,
            defaultValue: false,
          },
          action:   'setValues',
          override: false,
          map: {
            name: {
              source:   'title',
              sanitize: 'dasherize',
            },
          },
        },
      },
      {
        name:       'name',
        type:       'text',
        label:       await loc._c('eav', 'Name'),
        placeholder: await loc._c('eav', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:       'fieldName',
        type:       'text',
        label:       await loc._c('eav', 'Field'),
        placeholder: await loc._c('eav', 'Type the field name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'type.uuid',
        gridName:    'type.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('eav', 'Type'),
        placeholder: await loc._c('eav', 'Select the type'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'attribute/type',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'modelEntityName.uuid',
        gridName:    'modelEntityName.name',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('eav', 'Entity'),
        placeholder: await loc._c('eav', 'Select the entity'),
        isField:     true,
        isColumn:    true,
        loadOptionsFrom: {
          service: 'attribute/entity',
          value:   'uuid',
          text:    'name',
          title:   'description',
        },
      },
      {
        name:        'order',
        type:        'number',
        label:       await loc._c('eav', 'Order'),
        placeholder: await loc._c('eav', 'Type the order here'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isField',
        type:        'checkbox',
        gridType:    'check',
        label:       await loc._c('eav', 'Field'),
        placeholder: await loc._c('eav', 'Check for show as field or uncheck for not'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isColumn',
        type:        'checkbox',
        gridType:    'check',
        label:       await loc._c('eav', 'Column'),
        placeholder: await loc._c('eav', 'Check for show as column or uncheck for not'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isDetail',
        type:        'checkbox',
        gridType:    'check',
        label:       await loc._c('eav', 'Detail'),
        placeholder: await loc._c('eav', 'Check for show as detail or uncheck for not'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isRequired',
        type:        'checkbox',
        gridType:    'check',
        label:       await loc._c('eav', 'Required'),
        placeholder: await loc._c('eav', 'Check for use as required field or uncheck for not'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'isMultiple',
        type:        'checkbox',
        gridType:    'check',
        label:       await loc._c('eav', 'Multiple'),
        placeholder: await loc._c('eav', 'Check for use with multiple values or uncheck for not'),
        value:       true,
        isField:     true,
        isColumn:    true,
      },
      {
        name:        'category.uuid',
        gridName:    'category.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('eav', 'Category'),
        placeholder: await loc._c('eav', 'Select the category'),
        isField:     true,
        isDetail:    true,
        loadOptionsFrom: {
          service: 'attribute/category',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       await loc._c('eav', 'Description'),
        placeholder: await loc._c('eav', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: await loc._c('eav', 'Attributes'),
      load: {
        service: 'attribute',
        method: 'get',
      },
      action: 'attribute',
      gridActions,
      fields,
    };

    return result;
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