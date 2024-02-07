import {CommentTypeService} from './services/comment_type.js';
import {CommentEntityTypeService} from './services/entity_type.js';
import {CommentService} from './services/comment.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;
conf.entityTypeCache = {};
conf.commentTypesCache = {};
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
    global.eventBus?.$on('sanitized', sanitized);
}

async function init() {
    conf.commentTypeService = CommentTypeService.singleton();
    conf.entityTypeService =  CommentEntityTypeService.singleton();
    conf.commentService =     CommentService.singleton();
}

async function updateData(global) {
    const data = global?.data;

    await runSequentially(data?.commentsTypes, async data => await conf.commentTypeService.createOrUpdate(data));
}

async function clearCache() {
    conf.entityTypeCache = {};
    conf.fieldsCache = {};
    conf.columnsCache = {};
    conf.detailsCache = {};    
}

async function checkClearCache(entity) {
    if (entity === 'Type'
        || entity === 'Comment'
        || entity === 'EntityType'
    ) {
        await clearCache();
    }

    return;
}

async function getEnityTypeId(entity, options) {
    if (conf.entityTypeCache[entity] === undefined) {
        conf.entityTypeCache[entity] = await conf.entityTypeService.getIdForName(entity, options);
    }

    return conf.entityTypeCache[entity];
}

async function getCommentTypesForEntity(entity, options) {
    conf.commentTypesCache[entity] ||= {};
    const commentTypesCache = conf.commentTypesCache[entity];

    const language = options?.loc?.language;
    if (commentTypesCache[language] === undefined) {
        commentTypesCache[language] = {};
        
        const commentTypes = await conf.commentTypeService.getForEntityName(
            entity,
            {
                raw: true,
                nest: true,
                loc: options?.loc,
            }
        );

        commentTypesCache[language] = commentTypes;
    }

    return commentTypesCache[language];
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

        const commentTypes = await getCommentTypesForEntity(entity, options);
        if (!commentTypes?.length) {
            return;
        }

        const loc = options?.loc;
        const fields = [];
        for (const commentType of commentTypes) {
            if (!commentType.isField) {
                continue;
            }

            const field = {
                name: commentType.name,
                label: commentType.title,
                type: 'list',
                className: 'hide-marker',
                readonly: true,
                items: {
                    className: 'framed',
                },
                properties: [
                    {
                        name: 'comment',
                    },
                    {
                        name: 'createdAt',
                        type: 'dateTime',
                        label: await loc._c('comment', 'Date'),
                        format: '%x %R',
                        className: 'small',
                    },
                    {
                        name: 'User.displayName',
                        label: await loc._c('comment', 'User'),
                        className: 'framed detail small',
                    },
                ],
            };
            fields.push(field);

            const addField = {
                name: commentType.addName,
                label: commentType.addTitle,
                type: 'textArea',
            };
            fields.push(addField);
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

    const loc = options?.loc;
    const language = options?.loc?.language;
    if (columnsCache[language] === undefined) {
        columnsCache[language] = [];
        detailsCache[language] = [];

        const commentTypes = await getCommentTypesForEntity(entity, options);
        const columns = [];
        const details = [];
        for (const commentType of commentTypes) {
            if (!commentType.isColumn && !commentType.isDetail) {
                continue;
            }

            const field = {
                name: commentType.name,
                label: commentType.title,
                type: 'list',
                className: 'hide-marker',
                items: {
                    className: 'framed',
                },
                properties: [
                    {
                        name: 'comment',
                    },
                    {
                        name: 'createdAt',
                        type: 'dateTime',
                        label: await loc._c('comment', 'Date'),
                        format: '%x %R',
                        className: 'small',
                    },
                    {
                        name: 'User.displayName',
                        label: await loc._c('comment', 'User'),
                        className: 'framed detail small',
                    },
                ],
            };

            if (commentType.isColumn) {
                columns.push(field);
            }
            
            if (commentType.isDetail) {
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

    const commentTypes = await getCommentTypesForEntity(entity, {loc: options?.loc});
    if (!commentTypes?.length) {
        return result;
    }

    if (result.then) {
        result = await result;
    }

    const entityTypeId = await getEnityTypeId(entity, {loc: options?.loc});

    const rows = result.rows || result;
    for (const i in rows) {
        let row = rows[i];
        const entityId = row.id;
        if (entityId === undefined) {
            continue;
        }

        if (row.toJSON) {
            row = row.toJSON();
            rows[i] = row;
        }

        for (const commentType of commentTypes) {
            const commentTypeId = commentType.id;
            const name = commentType.name;
            const where = {
                entityTypeId,
                entityId,
                commentTypeId,
            };

            row[name] = await conf.commentService.getFor(where, {view: true, raw: true, nest: true, loc: options?.loc});
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
    const commentTypes = await getCommentTypesForEntity(entity, queryOptions);
    if (!commentTypes?.length) {
        return;
    }

    const entityTypeId = await getEnityTypeId(entity, queryOptions);

    let name,
        value;
    for (const entityId of entityIds) {
        for (const commentType of commentTypes) {
            name = commentType.name;
            if (name) {
                value = data[name];
            } else {
                value = false;
            }

            if (!value) {
                name = commentType.addName;
                if (!name) {
                    continue;
                }

                value = data[name];
                if (!value) {
                    continue;
                }
            }

            const optionData = {
                entityTypeId,
                entityId,
                commentTypeId: commentType.id,
            };

            await conf.commentService.create({...optionData, comment: value, userId: options.context.user.id}, queryOptions);
        }
    }
}

async function deleting(entity, options, service) {
    const queryOptions = {loc: options?.loc, transaction: options?.transaction};
    const commentTypes = await getCommentTypesForEntity(entity, queryOptions);
    if (!commentTypes?.length) {
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

        for (const commentType of commentTypes) {
            const optionData = {
                entityTypeId,
                entityId,
                commentTypeId: commentType.id,
            };

            await conf.commentService.deleteFor(optionData, queryOptions);
        }
    }
}

async function deleted(entity) {
    if (!entity) {
        return;
    }

    await checkClearCache(entity);
}

async function sanitized(entity, rows, options) {
    const commentTypes = await getCommentTypesForEntity(entity);
    if (!commentTypes?.length) {
        return;
    }

    if (rows.then) {
        rows = await rows;
    }

    for (const row of rows) {
        for (const commentType of commentTypes) {
            const name = commentType.name;
            if (!row[name]) {
                continue;
            }

            if (Array.isArray(row[name])) {
                if (conf.commentService.sanitize) {
                    row[name] = await conf.commentService.sanitize(row[name], options);
                }
            } else {
                if (conf.commentService.sanitizeRow) {
                    row[name] = await conf.commentService.sanitizeRow(row[name], options);
                }
            }
        }
    }

    return rows;
}