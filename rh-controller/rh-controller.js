import { getRoutes } from 'rf-get-routes';

/**
 * This is the base class for HTTP controller definitions.
 * The controller takes the functions methods static and non static and map to
 * routes. For more information please referer to rf-get-routes library.
 */
export class Controller {
  static routes() {
    const routes = getRoutes(
      this,
      {
        appendHandlers: [
          { name: 'getData', httpMethod: 'get', handler: 'defaultGet' },
          { name: 'getGrid', httpMethod: 'get', handler: 'defaultGet' }, 
          { name: 'getForm', httpMethod: 'get', handler: 'defaultGet' },
        ],
      },
    );

    return routes;
  }

  all(req, res) {
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

    res.status(405).send({ error: 'HTTP method not allowed.' });
  }
}
