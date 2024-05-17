import { getRoutes } from 'rf-get-routes';
import { checkParameter, checkParameterUuid } from 'rf-util';
import { deleteHandler, getUuidFromRequest, _HttpError } from 'http-util';
import { defaultLoc } from 'rf-locale';

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
 *  - getForm: for GET and using the defaultGet handler
 *  - getGrid: for GET and using the defaultGet handler
 *  - getData: for GET and using the defaultGet handler
 *  - getFormPermission: same as getForm
 *  - getGridPermission: same as getGrid
 *  - getDataPermission: same as getData
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
      if (this.getGrid) {
        instance = this;
      } else if (this.constructor.getGrid) {
        instance = this.constructor;
      }

      if (instance) {
        await this.checkPermissionsFromProperty(req, res, next, 'getGridPermission');
        await this.checkPermissionsFromProperty(req, res, next, 'get');

        const result = await instance.getGrid(req, res, next);
        res.status(200).json(result);
        return;
      }
    }
        
    if ('$form' in req.query) {
      let instance;
      if (this.getForm) {
        instance = this;
      } else if (this.constructor.getForm) {
        instance = this.constructor;
      }

      if (instance) {
        await this.checkPermissionsFromProperty(req, res, next, 'getForm');

        const result = await instance.getForm(req, res, next);
        res.status(200).json(result);
        return;
      }
    }

    let instance;
    if (this.getData) {
      instance = this;
    } else if (this.constructor.getData) {
      instance = this.constructor;
    }

    if (instance) {
      await this.checkPermissionsFromProperty(req, res, next, 'getData');
      await this.checkPermissionsFromProperty(req, res, next, 'get');

      const result = await instance.getData(req, res, next);
      res.status(200).json(result);
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

  async defaultDeleteForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'deleteForUuidPermission');

    const allParams = { ...req?.body, ...req?.query, ...req?.params };
    checkParameter(allParams, 'uuid');
    const uuid = checkParameterUuid(allParams.uuid);

    const rowCount = await this.service.deleteForUuid(uuid, { skipNoRowsError: true });
    await deleteHandler(req, res, rowCount);
  }

  async defaultEnableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'enableForUuidPermission');

    const allParams = { ...req?.body, ...req?.query, ...req?.params };
    checkParameter(allParams, 'uuid');
    const uuid = checkParameterUuid(allParams.uuid);

    const rowsUpdated = await this.service.enableForUuid(uuid);
    if (!rowsUpdated) {
      throw _HttpError((req.loc ?? defaultLoc)._cf('controller', 'Item with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

  async defaultDisableForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'disableForUuidPermission');

    const allParams = { ...req?.body, ...req?.query, ...req?.params };
    checkParameter(allParams, 'uuid');
    const uuid = checkParameterUuid(allParams.uuid);

    const rowsUpdated = await this.service.disableForUuid(uuid);
    if (!rowsUpdated) {
      throw _HttpError((req.loc ?? defaultLoc)._cf('controller', 'Item with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
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

  async defaultPatchForUuid(req, res, next) {
    await this.checkPermissionsFromProperty(req, res, next, 'patchForUuidPermission');

    const uuid = await this.checkUuid(req);

    const data = { ...req.body, uuid: undefined };
    const where = { uuid };

    const rowsUpdated = await this.service.updateFor(data, where);
    if (!rowsUpdated) {
      const loc = req.loc ?? defaultLoc;
      throw new _HttpError(loc._cf('controller', 'The item with UUID %s does not exists.'), 403, uuid);
    }

    res.sendStatus(204);
  }

}
