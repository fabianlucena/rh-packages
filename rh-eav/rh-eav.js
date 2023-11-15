import {EavAttributeService} from './services/attribute.js';
import {EavAttributeTypeService} from './services/attribute_type.js';
import {EavAttributeOptionService} from './services/attribute_option.js';
import {EavEntityTypeService} from './services/entity_type.js';
//import {EavValueTextService} from './services/value_text.js';
import {EavValueOptionService} from './services/value_option.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;
conf.fieldsCache = {};
conf.attributesCache = {};
conf.entityTypeCache = {};
conf.columnsCache = {};
conf.detailsCache = {};

async function configure(global, options) {
    for (const k in options) {
        conf[k] = options[k];
    }

    global.eventBus?.$on('interface.grid.get', interfaceGridGet);
    global.eventBus?.$on('interface.form.get', interfaceFormGet);
    global.eventBus?.$on('response.getted', responseGetted);
}

async function init() {
    conf.eavAttributeService =       EavAttributeService.singleton();
    conf.eavAttributeTypeService =   EavAttributeTypeService.singleton();
    conf.eavAttributeOptionService = EavAttributeOptionService.singleton();
    conf.eavEntityTypeService =      EavEntityTypeService.singleton();
    conf.eavValueOptionService =     EavValueOptionService.singleton();
}

async function updateData(global) {
    const data = global?.data;

    await runSequentially(data?.eavAttributesTypes, async data => await conf.eavAttributeTypeService.createIfNotExists(data));
    await runSequentially(data?.eavAttributes,      async data => await conf.eavAttributeService.    createOrUpdate(data));
}

const force = true;

async function getAttributes(entity, options) {
    if (conf.attributesCache[entity] === undefined || force) {
        const attributes = await conf.eavAttributeService.getForEntityName(
            entity,
            {
                includeAttributeType: true,
                raw: true,
                nest: true,
                loc: options.loc,
            }
        );

        conf.attributesCache[entity] = attributes;

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
                        label: option.title,
                    };
                }));
            }

            switch (attribute.EavAttributeType.name) {
            case 'option': attribute.htmlType = 'select'; break;
            default: attribute.htmlType = 'text';
            }
        }
    }

    return conf.attributesCache[entity];
}

async function getEnityTypeId(entity, options) {
    if (conf.entityTypeCache[entity] === undefined || force) {
        conf.entityTypeCache[entity] = await conf.eavEntityTypeService.getIdForName(entity, options);
    }

    return conf.entityTypeCache[entity];
}

async function interfaceFormGet(form, options) {
    const entity = options?.entity;
    if (!entity) {
        return;
    }

    if (conf.fieldsCache[entity] === undefined || force) {
        conf.fieldsCache[entity] = [];

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
            };

            fields.push(field);
        }

        conf.fieldsCache[entity].push(...fields);
    }

    form.fields.push(...conf.fieldsCache[entity]);
}

async function interfaceGridGet(grid, options) {
    const entity = options?.entity;
    if (!entity) {
        return;
    }

    if (conf.columnsCache[entity] === undefined || force) {
        conf.columnsCache[entity] = [];
        conf.detailsCache[entity] = [];

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
                options: attribute.options,
            };

            if (attribute.isColumn) {
                columns.push(field);
            }
            
            if (attribute.isDetail) {
                details.push(field);
            }
        }

        conf.columnsCache[entity].push(...columns);
        conf.detailsCache[entity].push(...details);
    }

    grid.columns ??= [];
    grid.details ??= [];

    grid.columns.push(...conf.columnsCache[entity]);
    grid.details.push(...conf.detailsCache[entity]);
}

async function responseGetted(result, options) {
    const entity = options?.entity;
    if (!entity) {
        return;
    }

    const attributes = await getAttributes(entity, options);
    if (!attributes?.length) {
        return;
    }

    const entityTypeId = await getEnityTypeId(entity, options);

    const rows = result.rows || result;
    for (const row of rows) {
        const entityId = row.id;

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
                const valueRow = await conf.eavValueTextService.getSingleFor(where, {raw: true, nest: true, ...options});
                row[name] = valueRow?.value;
            } break;
            case 'option': {
                const valueRow = await conf.eavValueOptionService.getFor(where,
                    {
                        includeAtributeOption: true,
                        raw: true,
                        nest: true,
                        ...options,
                    },
                );

                row[name] = valueRow?.AttributeOption;
            } break;
            default: row[name] = options.loc._c('eav', 'Error unknown attribute type: %s', typeName);
            }
        }
    }
}