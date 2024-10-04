import { errorHandler, deepComplete, runSequentially, stripQuotes, checkParameterUuid, BaseError } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import { installRoutes } from 'rf-express-routes';
import dependency from 'rf-dependency';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { Op } from 'rf-service';

export class HttpError extends BaseError {
  constructor(message, statusCode, ...params) {
    super({ message, statusCode, params });
  }
}

export class NotFoundError extends BaseError {
  statusCode = 404;

  constructor(message, options, ...params) {
    super({ message, options, params });
  }
}

export class UnauthorizedError extends BaseError {
  static visibleProperties = ['message', 'title'];

  statusCode = 401;

  constructor(message, options, ...params) {
    super({ message, options, ...params });
  }
}

export class ForbiddenError extends BaseError {
  statusCode = 403;

  constructor(message) {
    super({ message });
  }
}

export class NoPermissionError extends BaseError {
  static noObjectValues = ['permissions'];
  static visibleProperties = ['message', 'title', 'permissions', 'redirectTo'];
  message = async loc => loc._nn(
    this.permissions.length,
    'You do not have permission.',
    'You do not have permission: "%s"',
    'You do not have any of permissions: "%s".',
    await loc._or(...this.permissions),
  );

  statusCode = 403;
  permissions = [];

  constructor(permissions, options, ...params) {
    super({ permissions, options, ...params });
  }
}

export class MethodNotAllowedError extends BaseError {
  static noObjectValues = ['method'];
  static visibleProperties = ['message', 'title', 'method'];
  message = loc => loc._(
    'Method "%s" not allowed.',
    this.param[0],
  );
  param = ['<unknown>'];

  statusCode = 405;
  method = '';

  constructor(method) {
    super({ method });
  }
}

export class NoUUIDError extends BaseError {
  static noObjectValues = ['paramName'];
  static visibleProperties = ['message', 'title', 'paramName'];
  message = loc => loc._(
    'The "%s" parameter is not a valid UUID.',
    this.param[0],
  );
  param = ['<unknown>'];

  statusCode = 403;

  constructor(paramName) {
    super({ paramName });
  }
}

export class ConflictError extends BaseError {
  static visibleProperties = ['message'];
  statusCode = 409;

  constructor(message) {
    super(message);
    this.message ??= loc => loc._('Conflict.');
  }
}

function log(message) {
  if (typeof message === 'string') {
    message = { message };
  }

  switch(message.type) {
  case 'error': return console.error(message.message);
  case 'warning': return console.warn(message.message);
  case 'info': return console.info(message.message);
  default: return console.log(message.message);
  }
}

log.error = (message) => log({ type: 'error', message });
log.info = (message) => log({ type: 'info', message });
log.warning = (message) => log({ type: 'warning', message });

export const maxRowsInResult = 100;
export const defaultRowsInResult = 20;
export const defaultGlobal = {
  app: null,
  router: null,
  log: log,
  sequelize: null,
  beforeConfig: [],
  afterConfig: []
};

export async function httpUtilConfigure(global, ...modules) {
  if (!global) {
    global = { ...defaultGlobal };
  }

  if (global.checkRoutePermission === undefined) {
    if (global.checkPermissionHandler === undefined) {
      global.checkPermissionHandler = async () => {};
    }

    global.checkRoutePermission = (...permission) => (req, res, next) => {
      global.checkPermissionHandler(req, ...permission)
        .then(() => next())
        .catch(e => next(e));
    };
  }

  global.sequelize ??= global.db?.sequelize ?? global.config?.db?.sequelize;
  global.sequelize.Sequelize ??= global.Sequelize ?? global.db?.Sequelize ?? global.config?.db?.Sequelize;
  global.models ||= global.sequelize.models || {};

  const log = global.log;
  log?.info('.. Before config actions.');
  await beforeConfig(global);
  log?.info('.. Configuring modules.');
  await configureModules(global, modules);
  if (global.config.db.sync) {
    log?.info('.. Synchronizing DB.');
    await beforeSync(global);
    await syncDB(global);
  } else {
    log?.info('.. Skip DB synchronization.');
  }
  if (global.postConfigureModels) {
    log?.info('.. Post configuring modules.');
    await global.postConfigureModels(global.sequelize);
  } else {
    log?.info('.. Skip post configuring modules.');
  }
  log?.info('.. After synchronization DB.');
  await afterSync(global);
  log?.info('.. After config.');
  await afterConfig(global);
  if (global.config.db.updateData) {
    log?.info('.. Updating data.');
    await updateData(global);
  } else {
    log?.info('.. Skip updating data.');
  }
    
  await configureSwagger(global);
}

export function methodNotAllowed(req) {
  throw new MethodNotAllowedError(req.method);
}

export async function configureRouter(routesPath, router, checkPermission, options) {
  if (!router) {
    return;
  }

  if (!routesPath) {
    return;
  }

  if (!fs.existsSync(routesPath)) {
    throw new Error(`The routes path does not exists: ${routesPath}`);
  }
        
  const files = fs
    .readdirSync(routesPath)
    .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)));

  for (const file of files) {
    const fullFile = 'file://' + path.join(routesPath, file);
    const modulusRouter = (await import(fullFile)).default;
    modulusRouter(router, checkPermission);
  }
}

export function configureServices(services, servicesPath, options) {
  if (!servicesPath) {
    return;
  }
        
  fs
    .readdirSync(servicesPath)
    .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)))
    .forEach(async file => {
      const loadedServices = await import('file://' + path.join(servicesPath, file));
      for (let name in loadedServices) {
        const service = loadedServices[name];
        let l = name.length;
        if (l > 7 && name.endsWith('Service')) {
          name = name.substring(0, l - 7);
        }

        services[name] = service;
        dependency.addSingleton(service);
      }
    });
}

export async function configureControllers(controllers, controllersPath, options) {
  if (!controllersPath) {
    return;
  }
        
  const files = fs
    .readdirSync(controllersPath)
    .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)));

  for(const file of files) {
    const module = await import('file://' + path.join(controllersPath, file));
    for (const controllerName in module) {
      const controller = module[controllerName];
      let name = controllerName;
      const l = name.length;
      if (l > 10 && name.endsWith('Controller')) {
        name = name.substring(0, l - 10);
      }

      controllers[name] = controller;
    }
  }
}

export async function sendError(req, res, error) {
  const data = await errorHandler(error, req.loc, req.showErrorInConsole);
  if (data.stack) {
    delete data.stack;
  }

  res.status(data.statusCode ?? 500).send(data);
}

export function httpErrorHandler(req, res) {
  return async error => await sendError(req, res, error);
}

export function asyncHandler(methodContainer, method) {
  return async (req, res, next) => {
    try {
      if (!methodContainer) {
        throw new HttpError(loc => loc._('No method defined.'));
      }

      if (method) {
        if (typeof method === 'string') {
          await methodContainer[method](req, res, next);
        } else if (typeof method === 'function') {
          await methodContainer.call(method, req, res, next);
        } else {
          throw new HttpError(loc => loc._('Error in method definition.'));
        }
      } else {
        await methodContainer(req, res, next);
      }
    } catch(err) {
      next(err);
    }
  };
}

export function getOptionsFromOData(params, options) {
  options = { ...options };
  if (!params) {
    return options;
  }

  if (params.$select) {
    if (!options.attributes) {
      options.attributes = [];
    }

    params.$select.split(',')
      .forEach(column => options.attributes.push(column.trim()));
  }

  if (params.$q) {
    options.q = params.$q;
  }

  if (params.$top) {
    const limit = parseInt(params.$top);
    if (isNaN(limit)) {
      throw new HttpError(loc => loc._('Error to convert $top = "%s" parameter value to a integer number.'), 400, params.$top);
    }

    if (!options.overrideMaxRowsInResult && limit > maxRowsInResult) {
      throw new HttpError(loc => loc._('Too many rows to return, please select a lower number (at most %s) for $top parameter.'), 400, maxRowsInResult);
    }

    if (limit > options.maxLimit) {
      throw new HttpError(loc => loc._('Too many rows to return, please select a lower number (at most %s) for $top parameter.'), 400, options.maxLimit);
    }

    if (limit < 0) {
      throw new HttpError(loc => loc._('The $top parameter cannot be negative.'), 400);
    }

    options.limit = limit;
  }

  if (!options.limit) {
    options.limit = defaultRowsInResult;
  }

  if (params.$skip) {
    const offset = parseInt(params.$skip);
    if (isNaN(offset)) {
      throw new HttpError(loc => loc._('Error to convert $skip = "%s" parameter value to a integer number.'), 400, params.$skip);
    }

    if (offset < 0) {
      throw new HttpError(loc => loc._('The $skip param cannot be negative.'), 400);
    }
        
    options.offset = offset;
  }

  if (!options.offset) {
    options.offset = 0;
  }

  if (params.$filter) {
    const where = {};
    const filters = params.$filter.split('and').map(t => t.trim());
    for (const filter of filters) {
      const parts = filter.split(' ').map(t => t.trim()).filter(i => !!i);
      if (parts.length < 3) {
        throw new HttpError(loc => loc._('Error to compile filter in part "%s".'), 400, filter);
      }

      let operator;
      switch (parts[1]) {
      case 'eq': operator = Op.eq; break;
      case 'gt': operator = Op.gt; break;
      default: throw new HttpError(loc => loc._('Error to compile filter in part "%s", operator is supported.'), 400, filter);
      }

      let value = parts.slice(2).join(' ');
      if (value === 'null') {
        value = null;
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else {
        value = stripQuotes(value);
      }

      where[parts[0]] = { [operator]: value };
    }

    options.where = { ...options.where, ...where };
  }

  let orderBy = params.$orderBy ?? params.$orderby;
  if (orderBy) {
    options.orderBy ??= [];
    options.orderBy.push(
      ...orderBy
        .split(',')
        .map(o => o.split(' '))
    );
  }

  return options;
}

export function getWhereFromParams(params, definitions, where) {
  if (!params || !definitions) {
    return where;
  }

  for (const name in definitions) {
    let value = params[name];
    if (value === undefined) {
      return;
    }

    const def = definitions[name];
    if (def.endsWith('uuid')) {
      if (!uuid.validate(value)) {
        throw new NoUUIDError(name);
      }
    }

    where ??= {};
    where[name] = value;
  }

  return where;
}

export function getOptionsFromParamsAndOData(params, definitions, options) {
  options = getOptionsFromOData(params, options);
  options.where = getWhereFromParams(params, definitions, options.where);
  return options;
}

export class NoRowsError extends BaseError {
  message = loc => loc._('There are no rows.');

  constructor(message) {
    super({ message });
  }
}

export async function deleteHandler(req, res, rowCount) {
  const loc = req.loc ?? defaultLoc;
  if (!rowCount) {
    throw new NoRowsError({
      statusCode: 404,
      message: 'There are no items to delete',
    });
  } else if (rowCount != 1) {
    res.status(200).send({ msg: await loc._('%s items deleted.', rowCount) });
  } else {
    res.sendStatus(204);
  }
}

export async function patchHandler(req, res, rowCount) {
  const loc = req.loc ?? defaultLoc;
  if (!rowCount) {
    throw new NoRowsError({
      statusCode: 404,
      message: 'There are no items to update',
    });
  } else if (rowCount != 1) {
    res.status(200).send({ msg: await loc._('%s items update.', rowCount) });
  } else {
    res.sendStatus(204);
  }
}

export async function enableHandler(req, res, rowCount) {
  const loc = req.loc ?? defaultLoc;
  if (!rowCount) {
    throw new NoRowsError({
      statusCode: 404,
      message: 'There are no items to enable',
    });
  } else if (rowCount != 1) {
    res.status(200).send({ msg: await loc._('%s items enabled.', rowCount) });
  } else {
    res.sendStatus(204);
  }
}

export async function disableHandler(req, res, rowCount) {
  const loc = req.loc ?? defaultLoc;
  if (!rowCount) {
    throw new NoRowsError({
      statusCode: 404,
      message: 'There are no items to disable',
    });
  } else if (rowCount != 1) {
    res.status(200).send({ msg: await loc._('%s items disabled.', rowCount) });
  } else {
    res.sendStatus(204);
  }
}

export function getDeleteHandler(req, res) {
  return async rowCount => deleteHandler(req, res, rowCount);
}

export async function execAsyncMethodList(asyncMethodList, singleItemName, ...params) {
  let method,
    isEmpty,
    itemName;
  if (Array.isArray(asyncMethodList)) {
    if (!asyncMethodList.length) {
      return;
    }

    itemName = singleItemName;
    if (singleItemName === undefined || singleItemName === null || singleItemName < 0 || singleItemName >= asyncMethodList.length) {
      itemName = 0;
    }

    method = asyncMethodList.splice(itemName, 1)[0];
    isEmpty = !asyncMethodList.length;
  } else {
    itemName = singleItemName;
    if (itemName === undefined || itemName === null) {
      for (let name in asyncMethodList) {
        if (typeof asyncMethodList[name] == 'function') {
          itemName = name;
          break;
        }
      }

      if (!itemName) {
        return;
      }
    }

    method = asyncMethodList[itemName];
    delete asyncMethodList[itemName];

    isEmpty = !Object.keys(asyncMethodList).length;
  }

  if (!method) {
    return;
  }

  await method(...params);
  if (isEmpty || (singleItemName !== undefined && singleItemName !== null)) {
    return;
  }
            
  return await execAsyncMethodList(asyncMethodList, null, ...params);
}

export async function configureModule(global, module) {
  let params = [];
  if (Array.isArray(module)) {
    if (module.length > 1) {
      params = module.slice(1);
    }

    module = module[0];
  }

  if (typeof module === 'string') {
    const moduleName = module;
    global.log?.info('.... Module: ' + moduleName);

    let modulePath = moduleName;
    const tryModulePath = path.join(process.cwd(), module);
    if (tryModulePath.endsWith('.js') && fs.existsSync(tryModulePath)) {
      modulePath = url.pathToFileURL(tryModulePath).href;
    }

    if (!modulePath) {
      throw new Error(`Can't find module: "${moduleName}".`);
    }

    module = (await import(modulePath)).conf;
  }

  if (!module.name) {
    throw new Error('Module does not have a name.');
  }

  if (module.path) {
    const config = global?.config;
    if (config) {
      const env = config.env;
      if (env) {
        for (const sep of ['_', '-']) {
          let path = module.path + `/conf${sep}${env}.js`;
          if (fs.existsSync(path)) {
            deepComplete(module, (await import('file://' + path)).conf);
          }
        }
      }

      const suffix = config.suffix;
      if (suffix) {
        for (const sep of ['_', '-']) {
          let path = module.path + `/conf${sep}${suffix}.js`;
          if (fs.existsSync(path)) {
            deepComplete(module, (await import('file://' + path)).conf);
          }
        }
      }

      if (config.db?.updateData) {
        module.data ??= {};
                
        for (const sep of ['_', '-']) {
          let path = module.path + `/conf${sep}data.js`;
          if (fs.existsSync(path)) {
            deepComplete(module.data, (await import('file://' + path)).data);
          }

          if (suffix) {
            path = module.path + `/conf${sep}data${sep}${suffix}.js`;
            if (fs.existsSync(path)) {
              deepComplete(module.data, (await import('file://' + path)).data);
            }
          }
        }
      }
    }
  }

  global.modules.push(module);
  module.global = global;

  if (module.configure) {
    await module.configure(global, ...params);
  }

  if (module.modelsPath && global.configureModels) {
    await global.configureModels(module.modelsPath, global.sequelize);
  }

  if (module.servicesPath) {
    await configureServices(global.services, module.servicesPath);
  }

  if (module.controllersPath) {
    await configureControllers(global.controllers, module.controllersPath);
  }
  if (module.schema && global.createSchema) {
    await global.createSchema(module.schema);
  }

  if (module.data) {
    const moduleData = {};
    for (let type in module.data) {
      let data = module.data[type];
      if (typeof data === 'function') {
        data = await data();
      }

      moduleData[type] = data;
    }

    deepComplete(global.data, moduleData);
  }

  return module;
}

export async function installModule(global, module) {
  module.global = global;
  if (module.routesPath) {
    await configureRouter(module.routesPath, global.router, global.checkRoutePermission, module.routesPathOptions);
  }

  if (module.init) {
    if (typeof module.init === 'function') {
      await module.init();
    } else {
      await runSequentially(module.init, async method => await method());
    }
  }

  if (module.afterConfig) {
    const afterConfig = Array.isArray(module.afterConfig)?
      module.afterConfig:
      [module.afterConfig];
        
    global.afterConfig.push(...afterConfig);
  }
}

export async function configureModules(global, modules) {
  global.modules ||= [];
  global.services ||= {};
  global.controllers ||= {};
  global.data ||= {};
  global.router ||= global.config?.router;

  for (const i in modules) {
    modules[i] = await configureModule(global, modules[i]);
  }

  if (global.posConfigureModelsAssociations) {
    await global.posConfigureModelsAssociations(global.sequelize);
  }
    
  for (const module of modules) {
    await installModule(global, module);
  }

  await filterData(global);
}

export function installControllerRoutes(global) {
  for (const controllerName in global.controllers) {
    const controller = global.controllers[controllerName];
    controller.init && controller.init();
    if (controller.routes) {
      const routes = controller.routes();

      if (routes.cors) {
        for (const item of routes.cors) {
          const allowedMethods = item.httpMethods.join(',');
          routes.routes.unshift({
            httpMethod: 'options',
            path: item.path,
            handler: corsSimplePreflight(allowedMethods),
          });
        }
      }

      installRoutes(
        global.router,
        routes,
        {
          checkPermission: global.checkPermission,
        },
      );
    }
  }
}

export async function filterData(global) {
  if (!global.data) {
    return;
  }

  let updateData = global.config?.db?.updateData;
  if (!updateData || updateData === true) {
    return;
  }


  if (typeof updateData === 'string') {
    updateData = updateData.trim().split(',');
  }

  if (Array.isArray(updateData)) {
    const include = [],
      skip = [];
    for (let entity of updateData) {
      if (entity[0] === '!') {
        skip.push(entity.substring(1));
      } else {
        include.push(entity);
      }
    }

    updateData = {};

    if (include.length) {
      updateData.include = include;
    }

    if (skip.length) {
      updateData.skip = skip;
    }
  }

  if (typeof updateData !== 'object') {
    return;
  }

  const updateDataOptions = {};
  for (const entity in global.data) {
    updateDataOptions[entity] = true;
  }

  if (updateData.include) {
    for (const entity in updateDataOptions) {
      updateDataOptions[entity] = false;
    }

    if (typeof updateData.include === 'string') {
      updateData.include = updateData.include.trim().split(',').map(i => i.trim());
    }

    for (const entity of updateData.include) {
      updateDataOptions[entity] = true;
    }
  }

  if (updateData.skip) {
    if (typeof updateData.skip === 'string') {
      updateData.skip = updateData.skip.trim().split(',').map(i => i.trim());
    }

    for (const entity of updateData.skip) {
      updateDataOptions[entity] = false;
    }
  }

  const data = global.data;
  const newData = {};
  for (const entity in updateDataOptions) {
    if (updateDataOptions[entity]) {
      newData[entity] = data[entity];
    }
  }

  global.data = newData;
}

export function getPropertyFromItems(propertyName, list) {
  if (Array.isArray(list)) {
    const checkList = [];
    list.forEach(item => {
      const v = item[propertyName];
      if (v !== undefined) {
        checkList.push(v);
      }
    });

    return checkList;
  } else {
    const checkList = {};
    for (let name in list) {
      const item = list[name];
      const v = item[propertyName];
      if (v !== undefined) {
        checkList[name] = v;
      }
    }

    return checkList;
  }
}

export async function beforeConfig(global) {
  await execAsyncMethodList(global.beforeConfig);
}

export async function afterConfig(global) {
  await execAsyncMethodList(global.afterConfig, null, global);
}

export async function beforeSync(global) {
  if (global.sequelize) {
    const list = getPropertyFromItems('beforeSync', global.modules);
    await execAsyncMethodList(list, null, global);
  }
}

export async function afterSync(global) {
  if (global.sequelize) {
    const list = getPropertyFromItems('afterSync', global.modules);
    await execAsyncMethodList(list, null, global);
  }
}

export async function syncDB(global) {
  if (!global.sequelize) {
    return;
  }

  await global.sequelize.sync(global?.config?.db?.sync);
  const asyncMethodList = getPropertyFromItems('check', global.sequelize.models);
  await execAsyncMethodList(asyncMethodList);
}

export async function updateData(global) {
  if (!global.sequelize) {
    return;
  }

  const list = getPropertyFromItems('updateData', global.modules);
  await execAsyncMethodList(list, null, global);
}

export async function configureSwagger(global) {
  if (!global.swagger) {
    return;
  }
  
  try {
    let module = await import('swagger-jsdoc');
    const swaggerJSDoc = module.default;

    const swaggerUI = await import('swagger-ui-express');

    let apis = [];
    for (const module of global.modules) {
      apis.push(
        ...[module.routesPath, module.controllersPath]
          .filter(i => i)
          .map(i => i + '/*'),
      );
    }

    const swaggerSpec = swaggerJSDoc({
      definition: {
        openapi: '3.0.0',
        info: {
          title:'Rofa HTTP API',
          version:'1.0.0',
          description: 'System to use accountable accounts',
        },
        servers: [{ url: '/api' }],
        components: {
          securitySchemes: {
            bearerAuth: {
              description: 'Enter token with the `Bearer: ` prefix, eg. "Bearer 57bad00fbd50ce1af7c7d2..."',
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              scheme: 'bearer',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      apis: apis,
    });

    const router = global.router ?? global.app;
    
    router.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
    router.use(
      '/swagger.json',
      (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
      });
  }
  catch (err) {
    console.error(err);
  }
}

export function cookies(response, cookieName, cookieProperty) {
  const list = {};
  let cookieHeader = response;
  if (!cookieHeader) {
    return list;
  }

  if (cookieHeader.headers) {
    cookieHeader = cookieHeader.headers;
    if (!cookieHeader) {
      return list;
    }
  }
    
  if (cookieHeader['set-cookie']) {
    cookieHeader = cookieHeader['set-cookie'];
    if (!cookieHeader) {
      return list;
    }
  }

  cookieHeader.forEach(cookieData => {
    const cookieProps = cookieData.split(';');

    let [name, ...rest] = cookieProps[0].split('=');
    name = name?.trim();
    if (!name) {
      return;
    }

    const value = rest.join('=').trim();
    if (!value) {
      return;
    }

    const cookie = {
      value: decodeURIComponent(value),
    };

    cookieProps.slice(1).forEach(prop => {
      let [name, ...rest] = prop.split('=');
      name = name?.trim();
      if (!name) {
        return;
      }

      let value = rest.join('=').trim();
      if (!value) {
        return;
      }
            
      if (name === 'Expires') {
        value = new Date(value);
      } else {
        value = decodeURIComponent(value);
      }

      cookie[name] = decodeURIComponent(value);
    });

    list[name] = cookie;
  });

  let result = list;

  if (result) {
    if (cookieName) {
      result = result[cookieName];
    }

    if (result) {
      if (cookieProperty) {
        result = result[cookieProperty];
      }
    }
  }

  return result;
}

function reduceToSingleArray(list, sanitizeMethod) {
  if (typeof list === 'string') {
    list = list.split(',');
  }
    
  if (!sanitizeMethod) {
    sanitizeMethod = s => s;
  }

  return list?.map(list => list.split(',').map(item => sanitizeMethod(item)).reduce((a, v) => a = [...a, ...v]));
}

function checkCors(req, res, requestName, acceptable, responseName, sanitizeMethod) {
  if (!sanitizeMethod) {
    sanitizeMethod = s => s.trim();
  }

  const requestRaw = req.header(requestName);
  if (requestRaw) {
    const acceptableList = reduceToSingleArray(acceptable, sanitizeMethod);
    if (acceptableList) {
      const requestList = reduceToSingleArray(requestRaw);
      const negotiated = [];
      for (const value of requestList) {
        if (acceptableList.includes(sanitizeMethod(value))) {
          negotiated.push(value);
        }
      }

      res.header(responseName, negotiated.join(', '));
    }
  }
}

export function corsMiddlewareOrigins(...origins) {
  return (req, res, next) => {
    checkCors(req, res, 'Origin', origins, 'Access-Control-Allow-Origin', s => s.trim().toLowerCase());
    next();
  };
}

export function corsPreflight(options) {
  return (req, res) => {
    checkCors(req, res, 'Access-Control-Request-Headers', options.headers, 'Access-Control-Allow-Headers', s => s.trim().toLowerCase());
    checkCors(req, res, 'Access-Control-Request-Method',  options.methods, 'Access-Control-Allow-Methods', s => s.trim().toUpperCase());
    res.sendStatus(204);
  };
}

export function corsSimplePreflight(methods) {
  return corsPreflight({ headers: 'Content-Type,Authorization', methods });
}

export async function getUuidFromRequest(req, defaultResult) {
  let uuid;
  if (req.params?.uuid) {
    if (uuid === undefined) {
      uuid = req.params.uuid;
    } else if (uuid.toUpperCase() !== req.params.uuid.toUpperCase()) {
      if (typeof defaultResult !== 'undefined') {
        return defaultResult;
      }

      throw new HttpError(loc => loc._('UUID inconsistency. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  if (req.query?.uuid) {
    if (uuid === undefined) {
      uuid = req.query.uuid;
    } else if (uuid.toUpperCase() !== req.query.uuid.toUpperCase()) {
      if (typeof defaultResult !== 'undefined') {
        return defaultResult;
      }

      throw new HttpError(loc => loc._('UUID inconsistency. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  if (req.body?.uuid) {
    if (uuid === undefined) {
      uuid = req.body.uuid;
    } else if (uuid.toUpperCase() !== req.body.uuid.toUpperCase()) {
      if (typeof defaultResult !== 'undefined') {
        return defaultResult;
      }

      throw new HttpError(loc => loc._('UUID inconsistency. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  if (!uuid) {
    if (typeof defaultResult !== 'undefined') {
      return defaultResult;
    }
  }

  checkParameterUuid(uuid, loc => loc._('UUID'));

  return uuid;
}

export function makeContext(req, res) {
  return {
    req,
    res,
    loc: req.loc,
    permissions: req.permissions,
    user: req.user,
    sessionId: req.sessionId ?? req.session?.id,
  };
}