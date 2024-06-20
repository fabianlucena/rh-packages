import { getRoutes } from 'rf-get-routes';
import { deleteHandler, getUuidFromRequest, _HttpError, enableHandler, disableHandler, patchHandler } from 'http-util';
import { defaultLoc } from 'rf-locale';
import { dependency } from 'rf-dependency';

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
 *  - enableForUuid:  for POST and using the defaultEnableForUuid handler in path /enable
 *  - disableForUuid: for POST and using the defaultDisableForUuid handler in path /disable
 *  - deleteForUuidPermission: same as deleteForUuid
 *  - enableForUuidPermission: same as enableForUuid
 *  - disableForUuidPermission: same as disableForUuid
 */
export class Controller {
  static routes() {
    const routes = getRoutes(
      this,
      {
        appendHandlers: [
          { name: 'getData',        httpMethod: 'get',    handler: 'defaultGet',  inPathParam: 'uuid' },
          { name: 'getGrid',        httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getForm',        httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getObject',      httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'getFields',      httpMethod: 'get',    handler: 'defaultGet' },
          { name: 'post',           httpMethod: 'post',   handler: 'defaultPost' },
          { name: 'deleteForUuid',  httpMethod: 'delete', handler: 'defaultDeleteForUuid',  inPathParam: 'uuid' },
          { name: 'patchForUuid',   httpMethod: 'patch',  handler: 'defaultPatchForUuid',   inPathParam: 'uuid' },
          { name: 'enableForUuid',  httpMethod: 'post',   handler: 'defaultEnableForUuid',  inPathParam: 'uuid', path: '/enable' },
          { name: 'disableForUuid', httpMethod: 'post',   handler: 'defaultDisableForUuid', inPathParam: 'uuid', path: '/disable' },
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
      let instance;
      if (typeof this.getGrid === 'function') {
        instance = this;
      } else if (typeof this.constructor.getGrid === 'function') {
        instance = this.constructor;
      }

      let grid;
      if (instance) {
        await this.checkPermissionsFromProperty(req, res, next, 'getGrid');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        grid = await instance.getGrid(req, res, next);
      } else {
        if (typeof this.getFields === 'function') {
          instance = this;
        } else if (typeof this.constructor.getFields === 'function') {
          instance = this.constructor;
        }

        if (instance) {
          await this.checkPermissionsFromProperty(req, res, next, 'getGrid');
          await this.checkPermissionsFromProperty(req, res, next, 'get');

          grid = await instance.getFields(req, res, next);
        }
      }

      if (grid) {
        if (this.eventBus) {
          const loc = req.loc;
          const entity = this.getName();

          await this.eventBus.$emit('interface.grid.get', grid, { loc, entity });
          await this.eventBus.$emit(`${entity}.interface.grid.get`, grid, { loc });
        }

        res.status(200).json(grid);
        return;
      }
    }
    
    if ('$form' in req.query) {
      let instance;
      if (typeof this.getForm === 'function') {
        instance = this;
      } else if (typeof this.constructor.getForm === 'function') {
        instance = this.constructor;
      }

      let form;
      if (instance) {
        await this.checkPermissionsFromProperty(req, res, next, 'getForm');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        form = await instance.getForm(req, res, next);
      } else {
        if (typeof this.getFields === 'function') {
          instance = this;
        } else if (typeof this.constructor.getFields === 'function') {
          instance = this.constructor;
        }
  
        if (instance) {
          await this.checkPermissionsFromProperty(req, res, next, 'getForm');
          await this.checkPermissionsFromProperty(req, res, next, 'get');

          form = await instance.getFields(req, res, next);
        }
      }

      if (form) {
        if (this.eventBus) {
          const loc = req.loc;
          const entity = this.getName();

          await this.eventBus.$emit('interface.form.get', form, { loc, entity });
          await this.eventBus.$emit(`${entity}.interface.form.get`, form, { loc });
        }

        res.status(200).json(form);
        return;
      }
    }
        
    if ('$object' in req.query) {
      let instance;
      if (typeof this.getObject === 'function') {
        instance = this;
      } else if (typeof this.constructor.getObject === 'function') {
        instance = this.constructor;
      }

      let object;
      if (instance) {
        await this.checkPermissionsFromProperty(req, res, next, 'getObject');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        object = await instance.getObject(req, res, next);
      } else {
        if (typeof this.getFields === 'function') {
          instance = this;
        } else if (typeof this.constructor.getFields === 'function') {
          instance = this.constructor;
        }
  
        if (instance) {
          await this.checkPermissionsFromProperty(req, res, next, 'getObject');
          await this.checkPermissionsFromProperty(req, res, next, 'get');

          object = await instance.getFields(req, res, next);
        }
      }

      if (object) {
        if (this.eventBus) {
          const loc = req.loc;
          const entity = this.getName();

          await this.eventBus.$emit('interface.object.get', object, { loc, entity });
          await this.eventBus.$emit(`${entity}.interface.object.get`, object, { loc });
        }

        res.status(200).json(object);
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
      }

      const result = await this.service.getListAndCount(options);
      if (result) {
        res.send(result);
      } else if (!res.headersSent && res.statusCode === 200) {
        res.status(204).end();
      }

      return;
    }

    if (this.getGrid || this.constructor.getGrid
      || this.getForm || this.constructor.getForm
    ) {
      res.status(400).send({ error: 'Missing parameters.' });
      return;
    }

    res.status(405).send({ error: 'HTTP method not allowed.' });
  }

  async checkUuid(req) {
    const loc = req.loc ?? defaultLoc;
    const uuid = await getUuidFromRequest(req);
    const item = await this.service.getForUuid(uuid, { skipNoRowsError: true, loc });
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
    await this.service.create(data);

    res.status(204).send();
  }

  async defaultDeleteForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'deleteForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowCount = await this.service.deleteForUuid(uuid, { skipNoRowsError: true });
    await deleteHandler(req, res, rowCount);
  }

  async defaultEnableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'enableForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowsUpdated = await this.service.enableForUuid(uuid);
    await enableHandler(req, res, rowsUpdated);
  }

  async defaultDisableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'disableForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    const rowsUpdated = await this.service.disableForUuid(uuid);
    await disableHandler(req, res, rowsUpdated);
  }

  async defaultPatchForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'patchForUuidPermission');

    const { uuid } = await this.checkUuid(req);
    // eslint-disable-next-line no-unused-vars
    const { uuid: _, ...data } = { ...req.body };
    const where = { uuid };

    const rowsUpdated = await this.service.updateFor(data, where);
    await patchHandler(req, res, rowsUpdated);
  }
}
