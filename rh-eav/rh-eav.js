import {EavAttributeService} from './services/attribute.js';
import {EavAttributeTypeService} from './services/attribute_type.js';
import {EavAttributeOptionService} from './services/attribute_option.js';
import {EavEntityTypeService} from './services/entity_type.js';
import {EavValueTextService} from './services/value_text.js';
import {EavValueOptionService} from './services/value_option.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';
import {loc} from 'rf-locale';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;
conf.entityTypeCache = {};
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
    global.eventBus?.$on('getted', getted);
    global.eventBus?.$on('created', created);
    global.eventBus?.$on('updated', updated);
    global.eventBus?.$on('deleting', deleting);
    global.eventBus?.$on('deleted', deleted);
}

async function init() {
    conf.eavAttributeService =       EavAttributeService.singleton();
    conf.eavAttributeTypeService =   EavAttributeTypeService.singleton();
    conf.eavAttributeOptionService = EavAttributeOptionService.singleton();
    conf.eavEntityTypeService =      EavEntityTypeService.singleton();
    conf.eavValueTextService =       EavValueTextService.singleton();
    conf.eavValueOptionService =     EavValueOptionService.singleton();
}

async function updateData(global) {
    const data = global?.data;

    await runSequentially(data?.eavAttributesTypes, async data => await conf.eavAttributeTypeService.createIfNotExists(data));
    await runSequentially(data?.eavAttributes,      async data => await conf.eavAttributeService.    createOrUpdate(data));
}

async function clearCache() {
    conf.entityTypeCache = {};
    conf.attributesCache = {};
    conf.fieldsCache = {};
    conf.columnsCache = {};
    conf.detailsCache = {};    
}

async function checkClearCache(entity) {
    if (entity === 'EavAttribute'
        || entity === 'EavAttributeType'
        || entity === 'EavAttributeOption'
        || entity === 'EavEntityType'
    ) {
        await clearCache();
    }

    return;
}

async function getEnityTypeId(entity, options) {
    if (conf.entityTypeCache[entity] === undefined) {
        conf.entityTypeCache[entity] = await conf.eavEntityTypeService.getIdForName(entity, options);
    }

    return conf.entityTypeCache[entity];
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
                includeAttributeType: true,
                raw: true,
                nest: true,
                loc: options.loc,
            }
        );

        attributesCache[language] = attributes;

        for (const attribute of attributes) {
            const attributeOptions = await conf.eavAttributeOptionService.getFor(
                {attributeId: attribute.id},
                {
                    raw: true,
                    nest: true,
                    loc: options.loc,
                },
            );

            if (attributeOptions?.length) {
                attribute.options ||= [];
                attribute.options.push(...attributeOptions.map(option => {
                    return {
                        name: option.name,
                        value: option.uuid,
                        label: option.title,
                    };
                }));
            }

            attribute.type = attribute.EavAttributeType.name;
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
                options: attribute.options,
                valueProperty: 'uuid',
            };

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
    const detailsCache = conf.columnsCache[entity];

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

            const field = {
                name: attribute.name,
                label: attribute.title,
                type: attribute.htmlType,
            };

            if (attribute.type === 'select') {
                field.name = field.name + '.title';
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

    const attributes = await getAttributes(entity, {loc: options?.loc});
    if (!attributes?.length) {
        return result;
    }

    if (result.then) {
        result = await result;
    }

    const entityTypeId = await getEnityTypeId(entity, {loc: options?.loc});

    const rows = result.rows || result;
    for (const row of rows) {
        const entityId = row.id;
        if (entityId === undefined) {
            continue;
        }

        for (const attribute of attributes) {
            const attributeId = attribute.id;
            const name = attribute.name;
            const typeName = attribute.EavAttributeType.name;
            const where = {
                entityTypeId,
                entityId,
                attributeId,
            };

            switch (typeName) {
            case 'text': {
                const valueRow = await conf.eavValueTextService.getSingleFor(where, {raw: true, nest: true, loc: options?.loc});
                row[name] = valueRow?.value;
            } break;
            case 'select': {
                const valueRows = await conf.eavValueOptionService.getFor(where,
                    {
                        includeAtributeOption: true,
                        raw: true,
                        nest: true,
                        loc: options?.loc,
                    },
                );

                if (valueRows?.length) {
                    row[name] = valueRows[0]?.EavAttributeOption;
                }
            } break;
            default: row[name] = (options?.loc ?? loc)._c('eav', 'Error unknown attribute type: %s', typeName);
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
        withCount: false,
        raw: true,
        nest: true,
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
    const queryOptions = {loc: options?.loc, transaction: options?.transaction};
    const attributes = await getAttributes(entity, queryOptions);
    if (!attributes?.length) {
        return;
    }

    const entityTypeId = await getEnityTypeId(entity, queryOptions);

    for (const entityId of entityIds) {
        for (const attribute of attributes) {
            const name = attribute.name;
            const value = data[name];
            if (value === undefined) {
                continue;
            }

            const optionData = {
                entityTypeId,
                entityId,
                attributeId: attribute.id,
            };

            if (attribute.type === 'select') {
                let valueId;
                if (value) {
                    optionData.attributeOptionUuid = value;

                    const result = await conf.eavValueOptionService.getFor(optionData, queryOptions);
                    if (!result?.length) {
                        const inserted = await conf.eavValueOptionService.create(optionData, queryOptions);
                        valueId = inserted.id;
                    } else {
                        valueId = result[0].id;
                    }
                } else {
                    valueId = [];
                }

                await conf.eavValueOptionService.deleteFor({
                    entityTypeId,
                    entityId,
                    attributeId: attribute.id,
                    notId: valueId,
                });
            } else if (attribute.type === 'text') {
                const result = await conf.eavValueTextService.getFor(optionData, queryOptions);
                if (!result?.length) {
                    await conf.eavValueTextService.create({...optionData, value}, queryOptions);
                } else {
                    const valueId = result[0].id;
                    await conf.eavValueTextService.updateForId({value}, valueId, queryOptions);
                }
            } else {
                throw new Error('Unknown attribute type.');
            }
        }
    }
}

async function deleting(entity, options, service) {
    const queryOptions = {loc: options?.loc, transaction: options?.transaction};
    const attributes = await getAttributes(entity, queryOptions);
    if (!attributes?.length) {
        return;
    }

    const entityTypeId = await getEnityTypeId(entity, queryOptions);

    const rows = await service.getList({
        ...options,
        withCount: false,
        raw: true,
        nest: true,
        loc: options.loc,
    });
    for (const row of rows) {
        const entityId = row.id;
        if (entityId === undefined) {
            continue;
        }

        for (const attribute of attributes) {
            const optionData = {
                entityTypeId,
                entityId,
                attributeId: attribute.id,
            };

            let valueService;
            if (attribute.type === 'select') {
                valueService = conf.eavValueOptionService;
            } else if (attribute.type === 'text') {
                valueService = conf.eavValueTextService;
            } else {
                throw new Error('Unknown attribute type.');
            }

            await valueService .deleteFor(optionData, queryOptions);
        }
    }
}

async function deleted(entity) {
    if (!entity) {
        return;
    }

    await checkClearCache(entity);
}