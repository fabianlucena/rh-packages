import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import { defaultLoc } from 'rf-locale';
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

  global.eventBus?.$on('interface.grid.get', interfaceGridGet);
  global.eventBus?.$on('interface.form.get', interfaceFormGet);
  global.eventBus?.$on('getted',   getted);
  global.eventBus?.$on('created',  created);
  global.eventBus?.$on('updated',  updated);
  global.eventBus?.$on('deleting', deleting);
  global.eventBus?.$on('deleted',  deleted);
}

async function init() {
  if (!conf?.global?.services?.ModelEntityName?.singleton) {
    throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
  }
    
  conf.eavAttributeService =         dependency.get('eavAttributeService');
  conf.eavAttributeTypeService =     dependency.get('eavAttributeTypeService');
  conf.eavAttributeCategoryService = dependency.get('eavAttributeCategoryService');
  conf.eavAttributeOptionService =   dependency.get('eavAttributeOptionService');
  conf.eavAttributeTagService =      dependency.get('eavAttributeTagService');
  conf.modelEntityNameService =      dependency.get('modelEntityNameService');
  conf.eavValueTextService =         dependency.get('eavValueTextService');
  conf.eavValueNumberService =       dependency.get('eavValueNumberService');
  conf.eavValueCheckService =        dependency.get('eavValueCheckService');
  conf.eavValueOptionService =       dependency.get('eavValueOptionService');
  conf.eavValueTagService =          dependency.get('eavValueTagService');
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.eavAttributesCategories, async data => await conf.eavAttributeCategoryService.createIfNotExists(data));
  await runSequentially(data?.eavAttributesTypes,      async data => await conf.eavAttributeTypeService.    createIfNotExists(data));
  await runSequentially(data?.eavAttributes,           async data => await conf.eavAttributeService.        createOrUpdate(data));
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

async function getAttributes(entity, { loc }) {
  conf.attributesCache[entity] ||= {};
  const attributesCache = conf.attributesCache[entity];

  loc ??= defaultLoc;
  const language = loc.language;
  if (attributesCache[language] === undefined) {
    attributesCache[language] = {};
        
    const attributes = await conf.eavAttributeService.getForEntityName(
      entity,
      {
        include: {
          type: true,
          category: true,
        },
        loc,
      }
    );

    attributesCache[language] = attributes;

    for (const attribute of attributes) {
      const attrOptions = await conf.eavAttributeOptionService.getFor(
        { categoryId: attribute.categoryId },
        { loc },
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

async function interfaceFormGet({ form, entity, loc }) {
  if (!entity) {
    return;
  }

  conf.fieldsCache[entity] ||= {};
  const fieldsCache = conf.fieldsCache[entity];

  loc ??= defaultLoc;
  const language = loc?.language;
  if (fieldsCache[language] === undefined) {
    fieldsCache[language] = [];

    const attributes = await getAttributes(entity, { loc });
    if (!attributes?.length) {
      return;
    }

    const fields = [];
    for (const attribute of attributes) {
      if (!attribute.isField) {
        continue;
      }

      const fieldName = attribute.fieldName ?? attribute.name;
      const field = {
        name: fieldName,
        label: attribute.title,
        type: attribute.htmlType,
        condition: attribute.condition,
        help: attribute.help,
        helpTopic: attribute.helpTopic,
        order: attribute.order,
      };

      if (attribute.type === 'select') {
        field.options = attribute.options,
        field.valueProperty = 'uuid';
      } else if (attribute.type === 'tags') {
        field.loadOptionsFrom = {
          service: 'tags',
          query: {
            'category.uuid': attribute.category.uuid,
          },
        };
      }   

      fields.push(field);
    }

    fieldsCache[language].push(...fields);
  }

  for (var field of fieldsCache[language]) {
    if (typeof field.order === 'undefined') {
      form.fields.push(field);
    } else {
      form.fields.splice(field.order, 0, field);
    }
  }
}

async function interfaceGridGet({ grid, entity, loc }) {
  if (!entity) {
    return;
  }

  conf.columnsCache[entity] ||= {};
  conf.detailsCache[entity] ||= {};

  const columnsCache = conf.columnsCache[entity];
  const detailsCache = conf.detailsCache[entity];

  loc ??= defaultLoc;
  const language = loc?.language;
  if (columnsCache[language] === undefined) {
    columnsCache[language] = [];
    detailsCache[language] = [];

    const attributes = await getAttributes(entity, { loc });
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

async function getted({ entity, result, options }) {
  if (!entity) {
    return result;
  }

  const loc = options?.loc ?? defaultLoc;
  const attributes = await getAttributes(entity, { loc });
  if (!attributes?.length) {
    return result;
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
      case 'number': {
        const valueRow = await conf.eavValueNumberService.getSingleFor(
          where,
          {
            loc: options?.loc,
            skipNoRowsError: true,
          }
        );
        row[fieldName] = valueRow?.value;
      } break;
      case 'check': {
        const valueRow = await conf.eavValueCheckService.getSingleFor(
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
      default: row[fieldName] = await loc._c('eav', 'Error unknown attribute type: %s', typeName);
      }
    }
  }

  return result;
}

async function created({ entity, rows, data, options }) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);

  if (!rows.length) {
    return;
  }

  for (const row of rows) {
    const entityIds = [row.id];
    await updateValues({ entity, entityIds, data, options });
  }
}

async function updated({ entity, result, data, options, service }) {
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

  await updateValues({ entity, entityIds, data, options });
}

async function updateValues({ entity, entityIds, data, options }) {
  const queryOptions = { loc: options?.loc, transaction: options?.transaction };
  const attributes = await getAttributes(entity, queryOptions);
  if (!attributes?.length) {
    return;
  }

  const modelEntityNameId = await conf.modelEntityNameService.getSingleIdForName(entity, queryOptions);

  for (const entityId of entityIds) {
    for (const attribute of attributes) {
      const fieldName = attribute.fieldName ?? attribute.name;
      const value = data[fieldName];
      if (value === undefined || value === null) {
        continue;
      }

      const optionData = {
        attributeId: attribute.id,
        modelEntityNameId,
        entityId,
        categoryId: attribute.categoryId,
        value,
      };

      if (attribute.type === 'select') {
        await conf.eavValueOptionService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'text') {
        await conf.eavValueTextService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'number') {
        await conf.eavValueNumberService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'check') {
        await conf.eavValueCheckService.updateValue(optionData, queryOptions);
      } else if (attribute.type === 'tags') {
        await conf.eavValueTagService.updateValue(optionData, queryOptions);
      } else {
        throw new Error('Unknown attribute type.');
      }
    }
  }
}

async function deleting({ entity, options, service }) {
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
      } else if (attribute.type === 'number') {
        valueService = conf.eavValueNumberService;
      } else if (attribute.type === 'check') {
        valueService = conf.eavValueCheckService;
      } else if (attribute.type === 'tags') {
        valueService = conf.eavValueTagService;
      } else {
        throw new Error('Unknown attribute type.');
      }

      await valueService.deleteFor(optionData, queryOptions);
    }
  }
}

async function deleted({ entity }) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);
}
