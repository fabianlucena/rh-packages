import {corsSimplePreflight, asyncHandler} from 'http-util';
import express from 'express';
import dasherize from 'dasherize';

/**
 * This is the base class for HTTP controller definitions.
 * The controlle takes the function static methods and map to routes.
 * If no static variable path defined the path is taken from the name of the 
 * controller whitout the controller subfix and dasherising the name.
 * This behavior is made by the routes static function, su if yo overrides
 * this method remember call to super.routes().
 * 
 * - GET     => get
 * - POST    => post
 * - PATH    => path
 * - PUT     => put
 * - DELETE  => delete
 * - OPTIONS => options
 * 
 * Also an "all" static function method can be defined in the class for
 * hands the rest or all of the HTTP methods.
 * 
 * For the special case OPTIONS if is not defined the class can handle 
 * automatically for CORS case.
 * 
 * For the GET verb also the static function methods getGrid, getForm, and 
 * getData can be defined in place of get static function method. But warning
 * if the get static function method is defined in the class this behavior will 
 * be override, unless in the function call super.get(...).
 * 
 * A middlewares and permission checker can be defined using, theese word as 
 * sufix:
 * 
 *    static postMiddleware(req, res, next) { middleware body}
 *    static postPermission = 'create';
 *    static post(req, res) {...}
 * 
 * For defining subpath a especial sintax can be used.
 *    static post_special_path(...) {...}
 *    static ['post_special/path'](...) {...}
 * 
 * Also a middleware and permission can be defined using theese word as prefix:
 *    static middleware_post_special_path(...) {...}
 *    static permission_post_special_path = 'permission';
 *    static post_special_path(...) {...}
 * 
 *    static ['permission_post_special/path'](...) {...}
 *    static ['permission_post_special/path'] = 'permission';
 *    static ['post_special/path'](...) {...}
 */
export class RHController {
    static installRouteForMethod(router, checkPermission, path, httpMethod, methodName) {
        methodName ??= httpMethod;
        if (!this[methodName]) {
            return;
        }

        const params = [];

        const withPermission = methodName + 'Permission';
        if (this[withPermission]) {
            params.push(checkPermission(this[withPermission]));
        }

        const withPermission_ = 'permission_' + methodName;
        if (this[withPermission_]) {
            params.push(checkPermission(this[withPermission_]));
        }

        const withMiddleware = methodName + 'Middleware';
        if (this[withMiddleware]) {
            params.push(this[withMiddleware]);
        }

        const withMiddleware_ = 'middleware_' + methodName;
        if (this[withMiddleware_]) {
            params.push(this[withMiddleware_]);
        }

        params.push(asyncHandler(this, methodName));

        router[httpMethod](path, ...params);

        this.allPathsMethods ??= {};
        this.allPathsMethods[path] ??= [];
        this.allPathsMethods[path].push(httpMethod.toUpperCase());
    }

    static installRoutesForMethod(router, checkPermission, httpMethod, methodName) {
        const httpMethod_ = httpMethod + '_';
        const methodsNames = Object.getOwnPropertyNames(this)
            .filter(prop => prop.startsWith(httpMethod_))
            .filter(prop => typeof this[prop] === 'function');

        for (const methodName of methodsNames) {
            const rawArgs = methodName.slice(httpMethod_.length);
            const args = rawArgs.split('__');
            const path = '/' + args[0];

            this.installRouteForMethod(router, checkPermission, path, httpMethod, methodName);
        }

        this.installRouteForMethod(router, checkPermission, '', httpMethod, methodName);
    } 
    
    static routes(router, checkPermission, config) {
        let path = this.path;
        if (!path) {
            path = this.name;
            if (path.endsWith('controller') || path.endsWith('Controller')) {
                path = dasherize(path.substring(0, path.length - 10));
            }

            path = '/' + dasherize(path);
        }

        const ownRouter = express.Router();
        router.use(path, ownRouter);

        let getMethod;
        if (this.get) {
            getMethod = 'get';
        } else if (this.getData) {
            getMethod = 'defaultGet';
        }

        this.installRoutesForMethod(ownRouter, checkPermission, 'get', getMethod);
        this.installRoutesForMethod(ownRouter, checkPermission, 'post');
        this.installRoutesForMethod(ownRouter, checkPermission, 'patch');
        this.installRoutesForMethod(ownRouter, checkPermission, 'put');
        this.installRoutesForMethod(ownRouter, checkPermission, 'delete');
        this.installRoutesForMethod(ownRouter, checkPermission, 'options');

        if (config?.server?.cors && !this.options && this.allPathsMethods) {
            for (const thePath in this.allPathsMethods) {
                ownRouter.options(thePath, corsSimplePreflight(this.allPathsMethods[thePath].join(',')));
            }
        }

        this.installRouteForMethod(ownRouter, checkPermission, '', 'all');
    }

    static all(req, res) {
        res.status(405).send({error: 'HTTP method not allowed.'});
    }

    static defaultGet(req, res, next) {
        if (this.getData) {
            res.status(200).json(this.getData(req, res, next));    
        }
    }
}
