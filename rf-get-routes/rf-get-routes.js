/**
 * This function extracts routes from statics and non statics class methods.
 * The class from what the metods are extracted is called the controller.
 * 
 * First of all a base path for all of the endpoints is defined. The path is 
 * taken  from the non static (preferred) or static path property, if no path 
 * property is defined a "{controller}" default value is used. The special
 * token "{controller}" is replaced by the name of the class stripped for the 
 * "Controller" suffix and dasherized.
 * 
 * For each defined static or non static method will be checked for the name. 
 * If the name is any of HTTP methods (but in lower case) a route will be 
 * create for that method.
 * 
 * - GET     => get
 * - POST    => post
 * - PATCH   => patch
 * - PUT     => put
 * - DELETE  => delete
 * - OPTIONS => options
 * - any     => all
 * 
 * Also an "all" static method can be defined in the class for hands the rest 
 * or all of the HTTP methods, this value will be checked at the last.
 * 
 * A middlewares and permission checker can be defined using, theese word as 
 * sufix:
 *    postMiddleware(req, res, next) { middleware body}
 *    postPermission = 'create';
 *    post(req, res) {...}
 * 
 * For defining custom subpath a especial syntax can be used. The name of the 
 * method must be the same as above but with a suffix with the path separated 
 * by a blanck space. For Javascript limitations the name must be in quotes 
 * and square brackets.
 *    static 'post new-path-path'(...) {...}
 *    static 'get /:id'(...) {...}
 * 
 * Also a middleware and permission can be defined for the special subpath:
 *    static 'postMiddleware special/path'(...) {...}
 *    static 'postPermission special/path' = 'permission';
 *    static 'post special/path'(...) {...}
 * 
 * The result is an object with 4 properties:
 * {
 *  controller,
 *  path,
 *  routes,
 *  cors,
 *  paths,
 * }
 * 
 * - controller: is the name of the class.
 * - path: is the base path for this controller, can be a empty string.
 * - routes: is a list of objects with the routes see bellow.
 * - cors: is a list of paths and allowed methods for the CORS policies 
 *   definitions.
 * - paths: all of the paths used in routes.
 * 
 * The routes is a list of objects with the following properties:
 * - httpMethod: HTTP method in lower case,
 * - path: is the path for this endpoint inner the controller's path, 
 *   can be a empty string.
 * - handler: function for handle the request.
 * - method: the method to call for handled this endpoint.
 * - methodIsStatic: boolean indicator for the method if is static or non 
 *   static.
 * - permission: permission method or value to check the permission.
 * - permissionIsStatic: boolean indicator for the permission if is static or 
 *   non static.
 * - middleware: middleware method to call before call the handler.
 * - middlewareIsStatic: boolean indicator for the middleware if is static or 
 *   non static.
 * 
 * The cors is a list of items to be used to CORS policy configuration. 
 * Each item contains:
 * - path: the path for the policy.
 * - httpMethods: a list of uppercased methods under this path.
 * 
 * 
 * Extraction options:
 * The behavior of this function can be customized using the options parameter. 
 * This parameter is an objet with the following properties:
 * 
 * - skipStatic: [boolean]{default:false} avoid to scan for the static 
 *   methods and properties. 
 * - skipNonStatic: [boolean]{default:false} avoid to scan for the non static 
 *   methods and properties.
 * - skipParent: [boolean]{default:false} no scan parent classes, only for 
 *   static methods and properties.
 * - appendHandlers: [array]{default:undefined} add other handlers to extract, 
 *   for example 
 *   [{name: 'getData', httpMethod: 'get', handler: 'defaultGet'}],
 *   will search for getData method name in the controlles class, and will 
 *   generate a route for the HTTP method GET, using the defaultGet method 
 *   as handler: This minds that defaultGet will call to getData. This 
 *   extraction can be combined con subpath, premissions, and middlewares. 
 *   In this case, if you override the get method remember to call 
 *   this.defaultGet after return to properly handle.
 * - skipMethodNotAllowedHandler: [bool]{default:false} after the routes 
 *   handlers the systems adds handlers for all to handle HTTP 405 error for
 *   skip this behavior set this option to true.
 */

export class Routes {
  controllerClass = null;
  handlers = [
    { name: 'get' },
    { name: 'post' },
    { name: 'patch' },
    { name: 'put' },
    { name: 'delete' },
    { name: 'options' },
  ];
  paths = [];
  routes = [];

  constructor(controllerClass, options) {
    this.controllerClass = controllerClass;
    if (options) {
      this.setOptions(options);
    }
  }

  setOptions(options) {
    for (const k in options) {
      if (this[k]) {
        this[k](options[k]);
      } else {
        this[k] = options[k];
      }
    }
  }

  appendHandlers(handlers) {
    this.handlers.push(...handlers);
  }

  extractProps() {
    this.props = [];
    this.controllerInstance = new this.controllerClass;

    if (!this.skipNonStatic) {
      this.props.push(
        ...Object.getOwnPropertyNames(this.controllerInstance),
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(this.controllerInstance)),
      );
    }

    if (!this.skipStatic) {
      this.props.push(...Object.getOwnPropertyNames(this.controllerClass));
    }

    if (!this.skipParent) {
      let parent = Object.getPrototypeOf(this.controllerClass);
      while (parent && parent.name) {
        this.props.push(...Object.getOwnPropertyNames(parent));
        parent = Object.getPrototypeOf(parent);
      }
    }

    return this.props;
  }

  extractHandlers() {
    if (!this.skipAllHttpMethod) {
      if (!this.handlers.find(h => h.name === 'all')) {
        this.handlers.push({ name: 'all' });
      }
    }

    return this.handlers;
  }

  extractPath() {
    if (!this.path && this.path !== '') {
      this.path = this.controllerInstance.path;
      if (this.path === undefined) {
        this.path = this.controllerClass.path;

        if (!this.path && this.path !== '') {
          this.path = '/{controller}';
        }
      }
    }

    if (this.path.search('{controller}')) {
      let controller = this.controllerClass.name;
      if (controller.endsWith('controller') || controller.endsWith('Controller')) {
        controller = dasherize(controller.substring(0, controller.length - 10));
      }
      controller = dasherize(controller);

      this.path = this.path.replace(/\{controller\}/g, controller);
    }

    if (this.path.search('{{}')) {
      this.path = this.path.replace(/\{\{\}/g, '{');
    }

    return this.path;
  }

  extractCors() {
    this.cors ||= [];

    for (const route of this.routes) {
      const httpMethod = route.httpMethod.toUpperCase();
      if (httpMethod === 'ALL') {
        continue;
      }

      const path = route.path;
      const item = this.cors.find(i => i.path === path);
      if (!item) {
        this.cors.push({
          path,
          httpMethods: [httpMethod],
        });
      } else {
        if (!item.httpMethods.includes(httpMethod)) {
          item.httpMethods.push(httpMethod);
        }
      }
    }

    return this.cors;
  }

  extract() {
    this.paths = [];
    this.routes = [];

    this.extractProps();
    this.extractHandlers();
    this.extractForHandlers();
    this.extractPath();
    this.extractCors();

    if (!this.skipMethodNotAllowedHandler) {
      for (const path of this.paths) {
        if (!this.routes.find(r => r.httpMethod.toLowerCase() === 'all' && r.path === path)) {
          this.routes.push({
            httpMethod: 'all',
            path,
            handler: methodNotAllowedHandler,
          });
        }
      }
    }

    this.routesData = {
      controller: this.controllerClass,
      path: this.path,
      routes: this.routes,
      cors: this.cors,
      paths: this.paths,
    };

    return this.routesData;
  }

  extractForHandlers() {
    this.handlers.forEach(h => this.extractForHandler(h));
  }

  extractForHandler(handler) {
    this.props.forEach(prop => {
      const parts = prop.split(' ');
      let name = parts[0];
      if (handler.name !== name) {
        if (handler.handler) {
          if (name.startsWith(handler.name) && 
            (name.endsWith('Permission') || name.endsWith('Middleware'))
          ) {
            name = name.slice(0, -10);
          } else {
            return;
          }
        } else {
          return;
        }
      }

      const path = parts.length > 1?
        parts.slice(1).join(' '):
        '';
      if (this.routes.find(r => r.path === path && r.httpMethod === handler.httpMethod)) {
        return;
      }

      if (!this.paths.includes(path)) {
        this.paths.push(path);
      }

      const route = {
        httpMethod: handler.httpMethod ?? name,
        path,
      };

      if (this.controllerInstance[handler.handler]) {
        route.method = handler.handler;
        route.methodIsStatic = false;
      } else if (this.controllerClass[handler.handler]) {
        route.method = handler.handler;
        route.methodIsStatic = true;
      } else if (this.controllerInstance[prop]) {
        route.method = prop;
        route.methodIsStatic = false;
      } else if (this.controllerClass[prop]) {
        route.method = prop;
        route.methodIsStatic = true;
      }

      const pathSuffix = path?
        ' ' + path
        :'';

      let withSuffix = name + 'Permission' + pathSuffix;
      if (this.controllerInstance[withSuffix]) {
        route.permission = this.controllerInstance[withSuffix];
        route.permissionIsStatic = false;
      } else if (this.controllerClass[withSuffix]) {
        route.permission = this.controllerClass[withSuffix];
        route.permissionIsStatic = true;
      }

      withSuffix = name + 'Middleware' + pathSuffix;
      if (this.controllerInstance[withSuffix]) {
        route.middleware = this.controllerInstance[withSuffix];
        route.middlewareIsStatic = false;
      } else if (this.controllerClass[withSuffix]) {
        route.middleware = this.controllerClass[withSuffix];
        route.middlewareIsStatic = true;
      }

      this.routes.push(route);

      if (handler.inPathParam) {
        const routeWithParam = { ... route };
        routeWithParam.path += `/:${handler.inPathParam}`;
        if (this.routes.find(r => r.path === routeWithParam.path && r.httpMethod === handler.httpMethod)) {
          return;
        }
        
        this.routes.push(routeWithParam);
      }
    });
  }
}

export function getRoutes(controllerClass, options) {
  return (new Routes(controllerClass, options))
    .extract();
}

// eslint-disable-next-line no-unused-vars
function methodNotAllowedHandler(_req, res, _next) {
  res.status(405).send({ error: 'HTTP method not allowed.' });
}

function dasherize(text, sep) {
  if (!text) {
    return text;
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/([^a-zA-Z0-9]|(?<=[a-z])(?=[A-Z0-9])|(?<=[A-Z])(?=[0-9])|(?<=[0-9])(?=[a-zA-Z]))/)
    .map(t => t.trim().toLowerCase())
    .filter(t => t && t.match(/[a-zA-Z0-9]/))
    .join(sep ?? '-')
    .trim();
}