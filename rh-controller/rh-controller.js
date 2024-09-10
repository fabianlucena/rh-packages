import { getRoutes } from 'rf-get-routes';
import { deleteHandler, getUuidFromRequest, HttpError, enableHandler, disableHandler, patchHandler, makeContext, getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import { dependency } from 'rf-dependency';
import { sanitizeFields, ucfirst } from 'rf-util';


/**
 * This is the base class for HTTP controller definitions.
 * The controller takes the functions methods static and non static and map to
 * routes. For more information please referer to rf-get-routes library.
 * 
 *  This generate the routes from the functions members:
 *  - get
 *  - post
 *  - delete
 *  - patch
 *  - put
 *  - options
 * 
 *  Also a get route will generated if any member function is founded:
 *  - getData: for GET and using the defaultGet handler
 *  - getGrid: for GET and using the defaultGet handler
 *  - getForm: for GET and using the defaultGet handler
 *  - getObject: for GET and using the defaultGet handler
 *  - getInterface: for GET and using the defaultGet handler
 *  - getDefault: for GET and using the defaultGet handler
 *  - getDataPermission: same as getData
 *  - getGridPermission: same as getGrid
 *  - getFormPermission: same as getForm
 *  - getObjectPermission: same as getObject
 *  - getInterfacePermission: same as getObject
 *  - getDefaultPermission: same as getDefault
 *  - deleteForUuid: for DELETE and using the defaultDeleteForUuid handler
 *  - postEnableForUuid:  for POST and using the defaultPostEnableForUuid  handler in path /enable
 *  - postDisableForUuid: for POST and using the defaultPostDisableForUuid handler in path /disable
 *  - deleteForUuidPermission: same as deleteForUuid
 *  - postEnableForUuidPermission:  same as postEnableForUuid
 *  - postDisableForUuidPermission: same as postDisableForUuid
 */
export class Controller {
  static routes() {
    const routes = getRoutes(
      this,
      {
        appendHandlers: [
          { name: 'get',                httpMethod: 'get',    handler: 'defaultGet',  inPathParam: 'uuid' },
          { name: 'getData',            httpMethod: 'get',    handler: 'defaultGet',  inPathParam: 'uuid' },
          { name: 'getGrid',            httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getForm',            httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getObject',          httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getInterface',       httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getDefault',         httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getInterface',       httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'post',               httpMethod: 'post',   handler: 'defaultPost' },
          { name: 'deleteForUuid',      httpMethod: 'delete', handler: 'defaultDeleteForUuid',      inPathParam: 'uuid' },
          { name: 'patchForUuid',       httpMethod: 'patch',  handler: 'defaultPatchForUuid',       inPathParam: 'uuid' },
          { name: 'postEnableForUuid',  httpMethod: 'post',   handler: 'defaultPostEnableForUuid',  inPathParam: 'uuid', path: '/enable' },
          { name: 'postDisableForUuid', httpMethod: 'post',   handler: 'defaultPostDisableForUuid', inPathParam: 'uuid', path: '/disable' },
        ],
      },
    );

    return routes;
  }

  static all(req, res) {
    res.status(405).send({ error: 'HTTP method not allowed.' });
  }

  constructor() {
    this.eventBus = dependency.get('eventBus', null);
    if (this.service === undefined) {
      const Name = this.getName();
      const name = Name[0].toLocaleLowerCase() + Name.substring(1);
      const tryServiceName = name + 'Service';
      const tryService = dependency.get(tryServiceName, null);
      if (tryService) {
        this.service = tryService;
      }
    }
  }

  getName() {
    let name = this.constructor.name;
    if (name.endsWith('Controller')) {
      name = name.substring(0, name.length - 10);
    }

    return name;
  }

  async checkPermissionsFromProperty(req, res, next, property) {
    if (!req.checkPermission) {
      return;
    }

    let permissions;
    let propertyName = property + 'Permission';
    if (this[propertyName]) {
      permissions = this[propertyName];
    } else if (this.constructor[propertyName]) {
      permissions = this.constructor[propertyName];
    } else {
      propertyName = property + 'Permissions';
      if (this[propertyName]) {
        permissions = this[propertyName];
      } else if (this.constructor[propertyName]) {
        permissions = this.constructor[propertyName];
      }
    }

    if (!permissions) {
      return;
    }

    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }

    const checkPermissionHandler = await req.checkPermission(...permissions);
    if (!checkPermissionHandler) {
      return;
    }

    await checkPermissionHandler(req, res, next);
  }

  getPlainFields(fields) {
    const result = [];
    for (const field of fields) {
      result.push(field);
      if (field.fields) {
        result.push(...this.getPlainFields(field.fields));
      }
    }

    return result;
  }

  async sanitizeInterface(interfaceType, result, req) {
    const loc = req.loc ?? defaultLoc,
      translationContext = this.translationContext,
      options = {
        loc,
        translationContext: this.translationContext,
        ...result.fieldsFilter,
        interface: interfaceType,
        entity: this.getName(),
      };
    delete result.fieldsFilter;
    
    if (result.fields) {
      result.fields = await sanitizeFields(
        result.fields,
        options,
      );
    }

    if (result.columns) {
      result.columns = await sanitizeFields(
        result.columns,
        options,
      );
    }

    if (result.details) {
      result.details = await sanitizeFields(
        result.details,
        options,
      );
    }

    if (result.properties) {
      result.properties = await sanitizeFields(
        result.properties,
        options,
      );
    }

    if (interfaceType) {
      const substitutions = [ 'title' ];
      for (const dst of substitutions) {
        const src = interfaceType + ucfirst(dst);
        if (result[src] === undefined) {
          continue;
        }

        result[dst] = result[src];
        delete result[src];
      }
    }

    if (typeof result.title === 'function') {
      result.title = await result.title(loc, translationContext);
    }

    if (interfaceType === 'grid') {
      if (result.fields) {
        result.fields = this.getPlainFields(result.fields);
      }
    }

    return result;
  }

  async defaultGet(req, res, next) {
    let func,
      sanitize,
      eventOptionsResultName;
    const permissions = [],
      events = [],
      entity = this.getName();

    if ('$grid' in req.query) {
      if (typeof this.getGrid === 'function') {
        func = (...args) => this.getGrid(...args);
      } else if (typeof this.constructor.getGrid === 'function') {
        func = this.constructor.getGrid;
      } else if (typeof this.getInterface === 'function') {
        func = (...args) => this.getInterface(...args);
      } else if (typeof this.constructor.getInterface === 'function') {
        func = this.constructor.getInterface;
      } else if (this.service?.getInterface) {
        func = (...args) => this.service.getInterface(makeContext(...args));
      }

      permissions.push('getGrid', 'get');
      events.push('interface.grid.get', `${entity}.interface.grid.get`);
      eventOptionsResultName = 'grid';
      sanitize = (...params) => this.sanitizeInterface('grid', ...params);
    } else if ('$form' in req.query) {
      if (typeof this.getForm === 'function') {
        func = (...args) => this.getForm(...args);
      } else if (typeof this.constructor.getForm === 'function') {
        func = this.constructor.getForm;
      } else if (typeof this.getInterface === 'function') {
        func = (...args) => this.getInterface(...args);
      } else if (typeof this.constructor.getInterface === 'function') {
        func = this.constructor.getInterface;
      } else if (this.service?.getInterface) {
        func = (...args) => this.service.getInterface(makeContext(...args));
      }

      permissions.push('getForm', 'get');
      events.push('interface.form.get', `${entity}.interface.form.get`);
      eventOptionsResultName = 'form';
      sanitize = (...params) => this.sanitizeInterface('form', ...params);
    } else if ('$object' in req.query) {
      if (typeof this.getObject === 'function') {
        func = (...args) => this.getObject(...args);
      } else if (typeof this.constructor.getObject === 'function') {
        func = this.constructor.getObject;
      } else if (typeof this.getInterface === 'function') {
        func = (...args) => this.getInterface(...args);
      } else if (typeof this.constructor.getInterface === 'function') {
        func = this.constructor.getInterface;
      } else if (this.service?.getInterface) {
        func = (...args) => this.service.getInterface(makeContext(...args));
      }

      permissions.push('getObject', 'get');
      events.push('interface.object.get', `${entity}.interface.object.get`);
      eventOptionsResultName = 'object';
      sanitize = (...params) => this.sanitizeInterface('object', ...params);
    } else if ('$interface' in req.query) {
      if (typeof this.getInterface === 'function') {
        func = (...args) => this.getInterface(...args);
      } else if (typeof this.constructor.getInterface === 'function') {
        func = this.constructor.getInterface;
      } else if (this.service?.getInterface) {
        func = (...args) => this.service.getInterface(makeContext(...args));
      }

      permissions.push('getInterface', 'get');
      events.push('interface.get', `${entity}.interface.get`);
      eventOptionsResultName = 'interface';
      sanitize = (...params) => this.sanitizeInterface('interface', ...params);
    } else if ('$default' in req.query) {
      if (typeof this.getDefault === 'function') {
        func = (...args) => this.getDefault(...args);
      } else if (typeof this.constructor.getDefault === 'function') {
        func = this.constructor.getDefault;
      } else if (this.service?.getDefault) {
        func = (...args) => this.defaultGetDefault(...args);
      }

      permissions.push('getData', 'get');
      events.push('default.get', `${entity}.default.get`);
      eventOptionsResultName = 'default';
    } else {
      if (typeof this.getData === 'function') {
        func = (...args) => this.getData(...args);
      } else if (typeof this.constructor.getData === 'function') {
        func = this.constructor.getData;
      } else if (this.service) {
        func = (...args) => this.defaultGetData(...args);
      } else {
        if (this.getGrid || this.constructor.getGrid
          || this.getForm || this.constructor.getForm
          || this.getObject || this.constructor.getObject
          || this.getDefault || this.constructor.getDefault
        ) {
          res.status(400).send({ error: 'Missing parameters.' });
          return;
        }
      }

      permissions.push('getData', 'get');
      events.push('data.get', `${entity}.data.get`);
      eventOptionsResultName = 'data';
    }

    if (!func) {
      if (!res.headersSent) {
        res.status(405).send({ error: 'HTTP method not allowed.' });
      }

      return;
    }

    await Promise.all(
      permissions.map(
        async permission => await this.checkPermissionsFromProperty(req, res, next, permission)
      )
    );

    let result = await func(req, res, next);
    if (!result) {
      if (!res.headersSent && res.statusCode === 200) {
        res.status(204).end();
      }

      return;
    }

    if (this.eventBus) {
      const context = makeContext(req, res),
        eventOptions = { entity, result, loc: context.loc, context };

      if (eventOptionsResultName) {
        eventOptions[eventOptionsResultName] = result;
      }
    
      for (let i = 0; i < events.length; i++) {
        await this.eventBus.$emit(events[i], eventOptions);
      }
    }

    if (sanitize) {
      result = await sanitize(result, req, res);
    }
    
    res.status(200).json(result);
  }

  async defaultGetData(req, res, next) {
    if (!this.service) {
      res.status(405).send({ error: 'HTTP method not allowed.' });
      return;
    }

    let getOptions;
    if (typeof this.getOptions === 'function') {
      getOptions = (...args) => this.getOptions(...args);
    } else if (typeof this.constructor.getOptions === 'function') {
      getOptions = this.constructor.getOptions;
    } else {
      getOptions = (...args) => this.defaultGetOptions(...args);
    }

    const options = await getOptions(req, res, next);
    options.context ??= makeContext(req, res);
    options.loc = options.context.loc;

    let result = await this.service.getListAndCount(options);
    if (result) {
      result = await this.service.sanitize(result);
    }

    for (const row of result.rows) {
      this.addUuidList(row, row, '');
    }

    return result;
  }

  addUuidList(row, root, name) {
    for (const k in row) {
      const v = row[k];
      if (Array.isArray(v)) {
        const propertyName = name + k + '.uuid';
        if (typeof root[propertyName] === 'undefined') {
          root[propertyName] = v.map(i => i.uuid).filter(i => i);
        }

        for (const i of v) {
          this.addUuidList(i, root, name + k + '.');
        }
      } else if (typeof v === 'object') {
        this.addUuidList(v, root, name + k + '.');
      }
    }
  }

  async defaultGetOptions(req, res) {
    const options = await getOptionsFromParamsAndOData(
      { ...req.query, ...req.params },
      { uuid: 'uuid' },
    );
    options.context = makeContext(req, res);
    options.view ??= true;
    if (!this.service) {
      return options;
    }

    if (this.service.getOptions) {
      return this.service.getOptions(options);
    }
    
    if (this.service.references) {
      options.include = {};
      for (const name in this.service.references) {
        options.include[name] = true;
      }
    }

    return options;
  }

  async defaultGetDefault(req, res) {
    if (!this.service?.getDefault) {
      res.status(405).send({ error: 'HTTP method not allowed.' });
      return;
    }
    
    const options = {
      context: makeContext(req, res),
    };

    let row = await this.service.getDefault(options);
    if (!row) {
      return;
    }

    let result = {
      count: 1,
      rows: [ row ],
    };

    if (this.service.sanitize) {
      result = await this.service.sanitize(result);
    }

    return result;
  }

  async checkUuid(req, res) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const item = await this.service.getSingleOrNullForUuid(uuid, { skipNoRowsError: true, loc, context: makeContext(req, res) });
    if (!item) {
      throw new HttpError(loc => loc._c('controller', 'The item with UUID %s does not exists.'), 404, uuid);
    }

    return { uuid };
  }

  async getPostParams(req) {
    return { ...req?.body };
  }

  async defaultPost(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'postPermission');

    const data = await this.getPostParams(req, res);
    await this.service.create(data, { context: makeContext(req, res) });

    res.status(204).send();
  }

  async defaultDeleteForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'deleteForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowCount = await this.service.deleteForUuid(uuid, { skipNoRowsError: true, context: makeContext(req, res) });
    await deleteHandler(req, res, rowCount);
  }

  async defaultPostEnableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'enableForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowsUpdated = await this.service.enableForUuid(uuid, { context: makeContext(req, res) });
    await enableHandler(req, res, rowsUpdated);
  }

  async defaultPostDisableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'disableForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowsUpdated = await this.service.disableForUuid(uuid, { context: makeContext(req, res) });
    await disableHandler(req, res, rowsUpdated);
  }

  async defaultPatchForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'patchForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const { uuid: _, ...data } = { ...req.body };
    const where = { uuid };

    const rowsUpdated = await this.service.updateFor(data, where, { context: makeContext(req, res) });
    await patchHandler(req, res, rowsUpdated);
  }
}
