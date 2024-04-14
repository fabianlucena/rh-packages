import { setUpError, errorHandler, deepComplete, runSequentially, stripQuotes, checkParameterUuid } from 'rf-util';
import { loc, defaultLoc } from 'rf-locale';
import { installRoutes } from 'rf-express-routes';
import dependency from 'rf-dependency';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import url from 'url';

export class HttpError extends Error {
  constructor(message, statusCode, ...params) {
    super();
    setUpError(
      this,
      {
        message,
        statusCode,
        params
      }
    );
  }
}

export class _HttpError extends Error {
  constructor(message, statusCode, ...params) {
    super();
    setUpError(
      this,
      {
        _message: message,
        statusCode,
        params
      }
    );
  }
}

export class UnauthorizedError extends Error {
  static VisibleProperties = ['message', 'title'];

  statusCode = 401;

  constructor(message, options, ...params) {
    super();
    setUpError(
      this,
      {
        message,
        options,
        params
      }
    );
  }
}

export class _UnauthorizedError extends Error {
  static VisibleProperties = ['message', 'title', 'redirectTo'];

  statusCode = 401;

  constructor(_message, options, ...params) {
    super();
    setUpError(
      this,
      {
        _message,
        ...options,
        params
      }
    );
  }
}

export class NoPermissionError extends Error {
  static NoObjectValues = ['permissions'];
  static VisibleProperties = ['message', 'title', 'permissions', 'redirectTo'];
  static _zeroMessage = loc._f('You do not have permission.');
  static _message = loc._nf(0, 'You do not have permission: "%s"', 'You do not have any of permissions: "%s".');

  statusCode = 403;
  permissions = [];

  constructor(permissions, options, ...params) {
    super();
    setUpError(
      this,
      {
        permissions,
        options,
        params
      }
    );
  }

  _n() {return this.permissions.length;}

  async getMessageParams(loc) {
    return [await loc._or(...this.permissions)];
  }
}

export class MethodNotAllowedError extends Error {
  static NoObjectValues = ['method'];
  static VisibleProperties = ['message', 'title', 'method'];
  static _message = loc._f('Method "%s" not allowed.');
  static param = ['<unknown>'];

  statusCode = 405;
  method = '';

  constructor(method) {
    super();
    setUpError(
      this,
      {
        method
      }
    );
  }

  // eslint-disable-next-line no-unused-vars
  async getMessageParams(loc) {
    return [this.method];
  }
}

export class NoUUIDError extends Error {
  static NoObjectValues = ['paramName'];
  static VisibleProperties = ['message', 'title', 'paramName'];
  static _message = loc._f('The "%s" parameter is not a valid UUID.');
  static param = ['<unknown>'];

  statusCode = 403;

  constructor(paramName) {
    super();
    setUpError(this, { paramName });
  }
}

export class ConflictError extends Error {
  static VisibleProperties = ['message'];
  static _message = loc._f('Conflict.');

  statusCode = 409;

  constructor(message) {
    super();
    setUpError(this, { message });
  }
}

export class _ConflictError extends Error {
  static VisibleProperties = ['message'];
  static _message = loc._f('Conflict.');

  statusCode = 409;

  constructor(_message) {
    super();
    setUpError(this, { _message });
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
log.warining = (message) => log({ type: 'warning', message });

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

  await beforeConfig(global);
  await configureModules(global, modules);
  await beforeSync(global);
  if (global.config.db.sync) {
    await syncDB(global);
  }
  if (global.postConfigureModels) {
    global.postConfigureModels(global.sequelize);
  }
  await afterSync(global);
  await afterConfig(global);
  if (global.config.db.updateData) {
    await updateData(global);
  }
    
  configureSwagger(global);
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
    const modules = await import('file://' + path.join(controllersPath, file));
    for (const k in modules) {
      const module = modules[k];
      let name = k;
      const l = name.length;
      if (l > 10 && name.endsWith('Controller')) {
        name = name.substring(0, l - 10);
      }

      controllers[name] = module;
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
        throw new _HttpError(loc._f('No method defined.'));
      }

      if (method) {
        if (typeof method === 'string') {
          await methodContainer[method](req, res, next);
        } else if (typeof method === 'function') {
          await methodContainer.call(method, req, res, next);
        } else {
          throw new _HttpError(loc._f('Error in method definition.'));
        }
      } else {
        await methodContainer(req, res, next);
      }
    } catch(err) {
      next(err);
    }
  };
}

export async function getOptionsFromOData(params, options) {
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
      throw new _HttpError(loc._f('Error to convert $top = "%s" parameter value to a integer number.'), 400, params.$top);
    }

    if (!options.overrideMaxRowsInResult && limit > maxRowsInResult) {
      throw new _HttpError(loc._f('Too many rows to return, please select a lower number (at most %s) for $top parameter.'), 400, maxRowsInResult);
    }

    if (limit > options.maxLimit) {
      throw new _HttpError(loc._f('Too many rows to return, please select a lower number (at most %s) for $top parameter.'), 400, options.maxLimit);
    }

    if (limit < 0) {
      throw new _HttpError(loc._f('The $top parameter cannot be negative.'), 400);
    }

    options.limit = limit;
  }

  if (!options.limit) {
    options.limit = defaultRowsInResult;
  }

  if (params.$skip) {
    const offset = parseInt(params.$skip);
    if (isNaN(offset)) {
      throw new _HttpError(loc._f('Error to convert $skip = "%s" parameter value to a integer number.'), 400, params.$skip);
    }

    if (offset < 0) {
      throw new _HttpError(loc._f('The $skip param cannot be negative.'), 400);
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
        throw new _HttpError(loc._f('Error to compile filter in part "%s".'), 400, filter);
      }

      if (parts[1] !== 'eq') {
        throw new _HttpError(loc._f('Error to compile filter in part "%s", only the "eq" operator is supported.'), 400, filter);
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

      where[parts[0]] = value;
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

export async function getWhereOptionsFromParams(params, definitions, options) {
  options = { ...options };

  if (!params || !definitions) {
    return options;
  }

  for (const name in definitions) {
    const value = params[name];
    if (value !== undefined) {
      const def = definitions[name];
      switch (def) {
      case 'uuid':
        if (!uuid.validate(params.uuid)) {
          throw new NoUUIDError(name);
        }
      }
        
      options.where ??= {};
      options.where[name] = value;
    }
  }

  return options;
}

export async function getOptionsFromParamsAndOData(params, definitions, options) {
  options = await getOptionsFromOData(params, options);
  return await getWhereOptionsFromParams(params, definitions, options);
}

export async function deleteHandler(req, res, rowCount) {
  const loc = req.loc ?? defaultLoc;
  if (!rowCount) {
    res.status(200).send({ msg: await loc._('Nothing to delete.') });
  } else if (rowCount != 1) {
    res.status(200).send({ msg: await loc._('%s rows deleted.', rowCount) });
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
    const tryModulePath = path.join(process.cwd(), module);
    if (tryModulePath.endsWith('.js') && fs.existsSync(tryModulePath)) {
      module = url.pathToFileURL(tryModulePath).href;
    }

    module = (await import(module)).conf;
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

  global.modules[module.name] = module;
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
  global.modules ||= {};
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

  filterData(global);
}

export function installControllerRoutes(global) {
  for (const controllerName in global.controllers) {
    const controller = global.controllers[controllerName];
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

export function configureSwagger(global) {
  if (!global.swagger) {
    return;
  }
        
  let swaggerJSDoc;
  import('swagger-jsdoc')
    .then(module => {
      swaggerJSDoc = module.default;
      return import('swagger-ui-express');
    })
    .then(swaggerUI => {
      let apis = [];
      for (const moduleName in global.modules) {
        const module = global.modules[moduleName];
        if (module.apis) {
          apis.push(...module.apis);
        }
      }

      const swaggerDocs = swaggerJSDoc({
        swaggerDefinition: {
          info: {
            title:'Rofa HTTP API',
            version:'1.0.0',
            descrition: 'System to use accontable accounts'
          },
          securityDefinitions: {
            bearerAuth: {
              description: 'Enter token in format (Bearer &lt;token&gt;)',
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              scheme: 'bearer',
            }
          }
        },
        apis: apis
      });

      global.app.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    });
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

export async function getUuidFromRequest(req) {
  let uuid;
  if (req.params?.uuid) {
    if (uuid === undefined) {
      uuid = req.params.uuid;
    } else if (uuid.toUpperCase() !== req.params.uuid.toUpperCase()) {
      throw new _HttpError(loc._f('UUID inconsistence. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  if (req.query?.uuid) {
    if (uuid === undefined) {
      uuid = req.query.uuid;
    } else if (uuid.toUpperCase() !== req.query.uuid.toUpperCase()) {
      throw new _HttpError(loc._f('UUID inconsistence. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  if (req.body?.uuid) {
    if (uuid === undefined) {
      uuid = req.body.uuid;
    } else if (uuid.toUpperCase() !== req.body.uuid.toUpperCase()) {
      throw new _HttpError(loc._f('UUID inconsistence. Many UUIDs were received but they are different.'), 400, uuid);
    }
  }

  return checkParameterUuid(uuid, loc._f('UUID'));
}

export function makeContext(req, res) {
  return {
    req,
    res,
    loc: req.loc,
    user: req.user,
  };
}