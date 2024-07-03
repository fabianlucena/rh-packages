import { getRoutes } from 'rf-get-routes';
import { deleteHandler, getUuidFromRequest, _HttpError, enableHandler, disableHandler, patchHandler, makeContext } from 'http-util';
import { defaultLoc } from 'rf-locale';
import { dependency } from 'rf-dependency';
import { filterVisualItemsByAliasName } from 'rf-util';


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
 *  - getDataPermission: same as getData
 *  - getGridPermission: same as getGrid
 *  - getFormPermission: same as getForm
 *  - getObjectPermission: same as getObject
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
          { name: 'getData',            httpMethod: 'get',    handler: 'defaultGet',  inPathParam: 'uuid' },
          { name: 'getGrid',            httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getForm',            httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getObject',          httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getFields',          httpMethod: 'get',    handler: 'defaultGet' },
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

  async defaultGet(req, res, next) {
    if ('$grid' in req.query) {
      let func;
      if (typeof this.getGrid === 'function') {
        func = (...args) => this.getGrid(...args);
      } else if (typeof this.constructor.getGrid === 'function') {
        func = this.constructor.getGrid;
      } else if (typeof this.getFields === 'function') {
        func = (...args) => this.getFields(...args);
      } else if (typeof this.constructor.getFields === 'function') {
        func = this.constructor.getFields;
      }

      if (func) {
        await this.checkPermissionsFromProperty(req, res, next, 'getGrid');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        const grid = await func(req, res, next);
        if (grid) {
          if (this.eventBus) {
            const loc = req.loc;
            const entity = this.getName();

            await this.eventBus.$emit('interface.grid.get', grid, { loc, entity });
            await this.eventBus.$emit(`${entity}.interface.grid.get`, grid, { loc });
          }

          if (grid.fieldsFilter) {
            grid.fields = await filterVisualItemsByAliasName(grid.fields, grid.fieldsFilter);
            delete grid.fieldsFilter;
          }
          
          res.status(200).json(grid);
        }

        return;
      }
    }
    
    if ('$form' in req.query) {
      let func;
      if (typeof this.getForm === 'function') {
        func = (...args) => this.getForm(...args);
      } else if (typeof this.constructor.getForm === 'function') {
        func = this.constructor.getForm;
      } else if (typeof this.getFields === 'function') {
        func = (...args) => this.getFields(...args);
      } else if (typeof this.constructor.getFields === 'function') {
        func = this.constructor.getFields;
      }

      if (func) {
        await this.checkPermissionsFromProperty(req, res, next, 'getForm');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        const form = await func(req, res, next);
        if (form) {
          if (this.eventBus) {
            const loc = req.loc;
            const entity = this.getName();

            await this.eventBus.$emit('interface.form.get', form, { loc, entity });
            await this.eventBus.$emit(`${entity}.interface.form.get`, form, { loc });
          }

          if (form.fieldsFilter) {
            form.fields = await filterVisualItemsByAliasName(form.fields, form.fieldsFilter);
            delete form.fieldsFilter;
          }

          res.status(200).json(form);
        }

        return;
      }
    }
        
    if ('$object' in req.query) {
      let func;
      if (typeof this.getObject === 'function') {
        func = (...args) => this.getObject(...args);
      } else if (typeof this.constructor.getObject === 'function') {
        func = this.constructor.getObject;
      } else if (typeof this.getFields === 'function') {
        func = (...args) => this.getFields(...args);
      } else if (typeof this.constructor.getFields === 'function') {
        func = this.constructor.getFields;
      }

      if (func) {
        await this.checkPermissionsFromProperty(req, res, next, 'getObject');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        const object = await func(req, res, next);
        if (object) {
          if (this.eventBus) {
            const loc = req.loc;
            const entity = this.getName();

            await this.eventBus.$emit('interface.object.get', object, { loc, entity });
            await this.eventBus.$emit(`${entity}.interface.object.get`, object, { loc });
          }

          if (object.fieldsFilter) {
            object.fields = await filterVisualItemsByAliasName(object.fields, object.fieldsFilter);
            delete object.fieldsFilter;
          }

          res.status(200).json(object);
        }

        return;
      }
    }

    let instance;
    if (typeof this.getData === 'function') {
      instance = this;
    } else if (typeof this.constructor.getData === 'function') {
      instance = this.constructor;
    }

    if (instance) {
      await this.checkPermissionsFromProperty(req, res, next, 'getData');
      await this.checkPermissionsFromProperty(req, res, next, 'get');

      const result = await instance.getData(req, res, next);
      if (result) {
        res.send(result);
      } else if (!res.headersSent && res.statusCode === 200) {
        res.status(204).end();
      }

      return;
    }

    if (this.service) {
      await this.checkPermissionsFromProperty(req, res, next, 'getData');
      await this.checkPermissionsFromProperty(req, res, next, 'get');

      if (typeof this.getOptions === 'function') {
        instance = this;
      } else if (typeof this.constructor.getOptions === 'function') {
        instance = this.constructor;
      }

      let options;
      if (instance) {
        options = await instance.getOptions(req, res, next);
        options.context ??= makeContext(req, res);
      }

      let result = await this.service.getListAndCount(options);
      if (result) {
        result = await this.service.sanitize(result);
        res.send(result);
      } else if (!res.headersSent && res.statusCode === 200) {
        res.status(204).end();
      }

      return;
    }

    if (this.getGrid || this.constructor.getGrid
      || this.getForm || this.constructor.getForm
      || this.getObject || this.constructor.getObject
    ) {
      res.status(400).send({ error: 'Missing parameters.' });
      return;
    }

    res.status(405).send({ error: 'HTTP method not allowed.' });
  }

  async checkUuid(req, res) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const item = await this.service.getForUuid(uuid, { skipNoRowsError: true, loc, context: makeContext(req, res) });
    if (!item) {
      throw new _HttpError(loc._cf('controller', 'The item with UUID %s does not exists.'), 404, uuid);
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
