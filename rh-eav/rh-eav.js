import { EavAttributeService } from './services/attribute.js';
import { EavAttributeTypeService } from './services/attribute_type.js';
import { EavAttributeOptionService } from './services/attribute_option.js';
import { EavAttributeTagService } from './services/attribute_tag.js';
import { EavValueTextService } from './services/value_text.js';
import { EavValueOptionService } from './services/value_option.js';
import { EavValueTagService } from './services/value_tag.js';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import { loc } from 'rf-locale';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;
conf.modelEntityNameCache = {};
conf.attributesCache = {};
conf.fieldsCache = {};
conf.columnsCache = {};
conf.detailsCache = {};

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }

  dependency.addSingleton('attributeService',       EavAttributeService);
  dependency.addSingleton('attributeTypeService',   EavAttributeTypeService);
  dependency.addSingleton('attributeOptionService', EavAttributeOptionService);
  dependency.addSingleton('attributeTagService',    EavAttributeTagService);
  dependency.addSingleton('valueTextService',       EavValueTextService);
  dependency.addSingleton('valueOptionService',     EavValueOptionService);
  dependency.addSingleton('valueTagService',        EavValueTagService);

  global.eventBus?.$on('interface.grid.get', interfaceGridGet);
  global.eventBus?.$on('interface.form.get', interfaceFormGet);
  global.eventBus?.$on('getted', getted);
  global.eventBus?.$on('created', created);
  global.eventBus?.$on('updated', updated);
  global.eventBus?.$on('deleting', deleting);
  global.eventBus?.$on('deleted', deleted);
}

async function init() {
  if (!conf?.global?.services?.ModelEntityName?.singleton) {
    throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
  }
    
  conf.eavAttributeService =       EavAttributeService.singleton();
  conf.eavAttributeTypeService =   EavAttributeTypeService.singleton();
  conf.eavAttributeOptionService = EavAttributeOptionService.singleton();
  conf.eavAttributeTagService =    EavAttributeTagService.singleton();
  conf.modelEntityNameService =    conf?.global?.services?.ModelEntityName?.singleton();
  conf.eavValueTextService =       EavValueTextService.singleton();
  conf.eavValueOptionService =     EavValueOptionService.singleton();
  conf.eavValueTagService =        EavValueTagService.singleton();
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.eavAttributesTypes, async data => await conf.eavAttributeTypeService.createIfNotExists(data));
  await runSequentially(data?.eavAttributes,      async data => await conf.eavAttributeService.    createOrUpdate(data));
}

async function clearCache() {
  conf.modelEntityNameCache = {};
  conf.attributesCache = {};
  conf.fieldsCache = {};
  conf.columnsCache = {};
  conf.detailsCache = {};    
}

async function checkClearCache(entity) {
  if (entity === 'EavAttribute'
    || entity === 'EavAttributeType'
    || entity === 'EavAttributeOption'
    || entity === 'ModelEntityName'
  ) {
    await clearCache();
  }

  return;
}

async function getAttributes(entity, options) {
  conf.attributesCache[entity] ||= {};
  const attributesCache = conf.attributesCache[entity];

  const language = options?.loc?.language;
  if (attributesCache[language] === undefined) {
    attributesCache[language] = {};
        
    const attributes = await conf.eavAttributeService.getForEntityName(
      entity,
      {
        include: { type: true },
        loc: options.loc,
      }
    );

    attributesCache[language] = attributes;

    for (const attribute of attributes) {
      const attrOptions = await conf.eavAttributeOptionService.getFor(
        { categoryId: attribute.categoryId },
        {
          loc: options.loc,
        },
      );

      if (attrOptions?.length) {
        attribute.options ||= [];
        attribute.options.push(...attrOptions.map(option => {
          return {
            name: option.name,
            value: option.uuid,
            label: option.title,
          };
        }));
      }

      attribute.type = attribute.type.name;
      attribute.htmlType = attribute.type;
    }
  }

  return attributesCache[language];
}

async function interfaceFormGet(form, options) {
  const entity = options?.entity;
  if (!entity) {
    return;
  }

  conf.fieldsCache[entity] ||= {};
  const fieldsCache = conf.fieldsCache[entity];

  const language = options?.loc?.language;
  if (fieldsCache[language] === undefined) {
    fieldsCache[language] = [];

    const attributes = await getAttributes(entity, options);
    if (!attributes?.length) {
      return;
    }

    const fields = [];
    for (const attribute of attributes) {
      if (!attribute.isField) {
        continue;
      }

      const field = {
        name: attribute.name,
        label: attribute.title,
        type: attribute.htmlType,
      };

      if (attribute.type === 'select') {
        field.options = attribute.options,
        field.valueProperty = 'uuid';
      } else if (attribute.type === 'tags') {
        field.loadOptionsFrom = {
          service: 'eav/tags',
          query: {
            attributeUuid: attribute.uuid,
          },
        };
      }   

      fields.push(field);
    }

    fieldsCache[language].push(...fields);
  }

  form.fields.push(...fieldsCache[language]);
}

async function interfaceGridGet(grid, options) {
  const entity = options?.entity;
  if (!entity) {
    return;
  }

  conf.columnsCache[entity] ||= {};
  conf.detailsCache[entity] ||= {};

  const columnsCache = conf.columnsCache[entity];
  const detailsCache = conf.detailsCache[entity];

  const language = options?.loc?.language;
  if (columnsCache[language] === undefined) {
    columnsCache[language] = [];
    detailsCache[language] = [];

    const attributes = await getAttributes(entity, options);
    const columns = [];
    const details = [];
    for (const attribute of attributes) {
      if (!attribute.isColumn && !attribute.isDetail) {
        continue;
      }

      const fieldName = attribute.fieldName ?? attribute.name;
      const field = {
        name:  fieldName,
        label: attribute.title,
        type:  attribute.htmlType,
      };

      if (attribute.type === 'select') {
        field.name = fieldName + '.title';
      }

      if (attribute.isColumn) {
        columns.push(field);
      }
            
      if (attribute.isDetail) {
        details.push(field);
      }
    }

    columnsCache[language].push(...columns);
    detailsCache[language].push(...details);
  }

  grid.columns ??= [];
  grid.details ??= [];

  grid.columns.push(...columnsCache[language]);
  grid.details.push(...detailsCache[language]);
}

async function getted(entity, result, options) {
  if (!entity) {
    return result;
  }

  const attributes = await getAttributes(entity, { loc: options?.loc });
  if (!attributes?.length) {
    return result;
  }

  if (result.then) {
    result = await result;
  }

  const rows = result.rows || result;
  for (const iRow in rows) {
    const row = rows[iRow];
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }
        
    for (const attribute of attributes) {
      const attributeId = attribute.id;
      const fieldName = attribute.fieldName ?? attribute.name;
      const typeName = attribute.type;
      const where = {
        attributeId,
        entityId,
      };

      switch (typeName) {
      case 'text': {
        const valueRow = await conf.eavValueTextService.getSingleFor(
          where,
          {
            loc: options?.loc,
            skipNoRowsError: true,
          }
        );
        row[fieldName] = valueRow?.value;
      } break;
      case 'select': {
        const valueRows = await conf.eavValueOptionService.getFor(
          where,
          {
            include: { option: true },
            loc: options?.loc,
          },
        );

        if (valueRows?.length) {
          row[fieldName] = valueRows[0]?.option;
        }
      } break;
      case 'tags': {
        const valueRows = await conf.eavValueTagService.getFor(
          where,
          {
            include: { tag: true },
            loc: options?.loc,
          },
        );

        if (valueRows?.length) {
          row[fieldName] = valueRows.map(r => r.tag.name);
        }
      } break;
      default: row[fieldName] = await (options?.loc ?? loc)._c('eav', 'Error unknown attribute type: %s', typeName);
      }
    }
  }

  return result;
}

async function created(entity, result, data, options) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);

  if (result.then) {
    result = await result;
  }

  if (!result) {
    return;
  }

  const entityIds = [result.id];

  await updateValues(entity, entityIds, data, options);
}

async function updated(entity, result, data, options, service) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);

  if (result.then) {
    result = await result;
  }

  if (!result) {
    return;
  }

  const rows = await service.getList({
    ...options,
    loc: options.loc,
  });

  const entityIds = [];
  for (const row of rows) {
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }

    entityIds.push(entityId);
  }

  await updateValues(entity, entityIds, data, options);
}

async function updateValues(entity, entityIds, data, options) {
  const queryOptions = { loc: options?.loc, transaction: options?.transaction };
  const attributes = await getAttributes(entity, queryOptions);
  if (!attributes?.length) {
    return;
  }

  for (const entityId of entityIds) {
    for (const attribute of attributes) {
      const name = attribute.name;
      const value = data[name];
      if (value === undefined) {
        continue;
      }

      const optionData = {
        attributeId: attribute.id,
        entityId,
        categoryId: attribute.categoryId,
        value,
      };

      if (attribute.type === 'select') {
        await conf.eavValueOptionService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'text') {
        await conf.eavValueTextService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'tags') {
        await conf.eavValueTagService.updateValue(optionData, queryOptions);
      } else {
        throw new Error('Unknown attribute type.');
      }
    }
  }
}

async function deleting(entity, options, service) {
  const queryOptions = { loc: options?.loc, transaction: options?.transaction };
  const attributes = await getAttributes(entity, queryOptions);
  if (!attributes?.length) {
    return;
  }

  const rows = await service.getList({
    ...options,
    loc: options.loc,
  });
  for (const row of rows) {
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }

    for (const attribute of attributes) {
      const optionData = {
        attributeId: attribute.id,
        entityId,
      };

      let valueService;
      if (attribute.type === 'select') {
        valueService = conf.eavValueOptionService;
      } else if (attribute.type === 'text') {
        valueService = conf.eavValueTextService;
      } else if (attribute.type === 'tags') {
        valueService = conf.eavValueTagService;
      } else {
        throw new Error('Unknown attribute type.');
      }

      await valueService.deleteFor(optionData, queryOptions);
    }
  }
}

async function deleted(entity) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);
}