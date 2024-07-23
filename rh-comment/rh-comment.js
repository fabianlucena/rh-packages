import { CommentTypeService } from './services/comment_type.js';
import { CommentService } from './services/comment.js';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import { defaultLoc } from 'rf-locale';

export const conf = localConf;

conf.configure = configure;
conf.init = [init];
conf.updateData = updateData;
conf.modelEntityNameCache = {};
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
  global.eventBus?.$on('getted',    getted);
  global.eventBus?.$on('created',   created);
  global.eventBus?.$on('updated',   updated);
  global.eventBus?.$on('deleting',  deleting);
  global.eventBus?.$on('deleted',   deleted);
  global.eventBus?.$on('sanitized', sanitized);
}

async function init() {
  if (!conf?.global?.services?.ModelEntityName?.singleton) {
    throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
  }

  conf.commentTypeService =     CommentTypeService.singleton();
  conf.modelEntityNameService = conf.global.services.ModelEntityName.singleton();
  conf.commentService =         CommentService.singleton();
}

async function updateData(global) {
  const data = global?.data;

  await runSequentially(data?.commentsTypes, async data => await conf.commentTypeService.createOrUpdate(data));
}

async function clearCache() {
  conf.modelEntityNameCache = {};
  conf.fieldsCache = {};
  conf.columnsCache = {};
  conf.detailsCache = {};
}

async function checkClearCache(entity) {
  if (entity === 'Type'
    || entity === 'Comment'
    || entity === 'ModelEntityName'
  ) {
    await clearCache();
  }

  return;
}

async function getEntityTypeId(entity, options) {
  if (conf.modelEntityNameCache[entity] === undefined) {
    conf.modelEntityNameCache[entity] = await conf.modelEntityNameService.getSingleIdForName(entity, options);
  }

  return conf.modelEntityNameCache[entity];
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
        loc: options?.loc,
      }
    );

    commentTypesCache[language] = commentTypes;
  }

  return commentTypesCache[language];
}

async function interfaceFormGet({ form, entity, context }) {
  if (!entity) {
    return;
  }

  conf.fieldsCache[entity] ||= {};
  const fieldsCache = conf.fieldsCache[entity];

  const loc = context?.loc ?? defaultLoc,
    language = loc?.language;
  if (fieldsCache[language] === undefined) {
    fieldsCache[language] = [];

    const commentTypes = await getCommentTypesForEntity(entity, { loc });
    if (!commentTypes?.length) {
      return;
    }

    const fields = [];
    for (const commentType of commentTypes) {
      if (!commentType.isField) {
        continue;
      }

      const field = {
        name: commentType.fieldName ?? commentType.name,
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
        name: commentType.addName ?? (commentType.name + 'Add'),
        label: commentType.addTitle ?? await loc._c('comment', 'Add %s', commentType.title),
        type: 'textArea',
      };
      fields.push(addField);
    }

    fieldsCache[language].push(...fields);
  }

  form.fields.push(...fieldsCache[language]);
}

async function interfaceGridGet({ grid, entity, context }) {
  if (!entity) {
    return;
  }

  conf.columnsCache[entity] ||= {};
  conf.detailsCache[entity] ||= {};

  const columnsCache = conf.columnsCache[entity];
  const detailsCache = conf.detailsCache[entity];

  const loc = context?.loc ?? defaultLoc,
    language = loc?.language;
  if (columnsCache[language] === undefined) {
    columnsCache[language] = [];
    detailsCache[language] = [];

    const commentTypes = await getCommentTypesForEntity(entity, { loc });
    const columns = [];
    const details = [];
    for (const commentType of commentTypes) {
      if (!commentType.isColumn && !commentType.isDetail) {
        continue;
      }

      const field = {
        name: commentType.fieldName ?? commentType.name,
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
            name: 'user.displayName',
            label: await loc._c('comment', 'User'),
            className: 'framed detail small',
          },
        ],
      };

      if (commentType.isColumn) {
        field.isColumn = true;
        columns.push(field);
      }
            
      if (commentType.isDetail) {
        field.isDetail = true;
        details.push(field);
      }
    }

    columnsCache[language].push(...columns);
    detailsCache[language].push(...details);
  }

  if (grid.columns) {
    grid.columns.push(...columnsCache[language]);
  }

  if (grid.details) {
    grid.details.push(...detailsCache[language]);
  }

  if (grid.fields) {
    grid.fields.push(
      ...columnsCache[language],
      ...detailsCache[language]
    );
  }
}

async function getted({ entity, result, options }) {
  if (!entity) {
    return result;
  }

  const loc = options?.loc ?? defaultLoc;
  const commentTypes = await getCommentTypesForEntity(entity, { loc });
  if (!commentTypes?.length) {
    return result;
  }

  if (result.then) {
    result = await result;
  }

  const modelEntityNameId = await getEntityTypeId(entity, { loc });

  const rows = result.rows || result;
  for (const i in rows) {
    const row = rows[i];
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }

    for (const commentType of commentTypes) {
      const commentTypeId = commentType.id;
      const fieldName = commentType.fieldName ?? commentType.name;
      const where = {
        modelEntityNameId,
        entityId,
        commentTypeId,
      };

      row[fieldName] = await conf.commentService.getFor(
        where,
        {
          view: true,
          include: {
            user: { attributes: [ 'displayName' ] },
          },
          loc,
        },
      );
    }
  }

  return result;
}

async function created({ entity, result, data, options }) {
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

  await updateValues({ entity, entityIds, data, options });
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
  const commentTypes = await getCommentTypesForEntity(entity, queryOptions);
  if (!commentTypes?.length) {
    return;
  }

  const modelEntityNameId = await getEntityTypeId(entity, queryOptions);

  let fieldName,
    value;
  for (const entityId of entityIds) {
    for (const commentType of commentTypes) {
      fieldName = commentType.fieldName ?? commentType.name;
      if (fieldName) {
        value = data[fieldName];
      } else {
        value = false;
      }

      if (!value) {
        fieldName = commentType.addName ?? (commentType.name + 'Add');
        if (!fieldName) {
          continue;
        }

        value = data[fieldName];
        if (!value) {
          continue;
        }
      }

      const optionData = {
        modelEntityNameId,
        entityId,
        commentTypeId: commentType.id,
      };

      await conf.commentService.create({ ...optionData, comment: value, userId: options.context.user.id }, queryOptions);
    }
  }
}

async function deleting({ entity, options, service }) {
  const queryOptions = { loc: options?.loc, transaction: options?.transaction };
  const commentTypes = await getCommentTypesForEntity(entity, queryOptions);
  if (!commentTypes?.length) {
    return;
  }

  const modelEntityNameId = await getEntityTypeId(entity, queryOptions);

  const rows = await service.getList({
    ...options,
    loc: options.loc,
  });
  for (const row of rows) {
    const entityId = row.id;
    if (entityId === undefined) {
      continue;
    }

    for (const commentType of commentTypes) {
      const optionData = {
        modelEntityNameId,
        entityId,
        commentTypeId: commentType.id,
      };

      await conf.commentService.deleteFor(optionData, queryOptions);
    }
  }
}

async function deleted({ entity }) {
  if (!entity) {
    return;
  }

  await checkClearCache(entity);
}

async function sanitized({ entity, rows, options }) {
  const commentTypes = await getCommentTypesForEntity(entity);
  if (!commentTypes?.length) {
    return;
  }

  if (rows.then) {
    rows = await rows;
  }

  for (const row of rows) {
    for (const commentType of commentTypes) {
      const fieldName = commentType.fieldName ?? commentType.name;
      if (!row[fieldName]) {
        continue;
      }

      if (Array.isArray(row[fieldName])) {
        if (conf.commentService.sanitize) {
          row[fieldName] = await conf.commentService.sanitize(row[fieldName], options);
        }
      } else {
        if (conf.commentService.sanitizeRow) {
          row[fieldName] = await conf.commentService.sanitizeRow(row[fieldName], options);
        }
      }
    }
  }

  return rows;
}