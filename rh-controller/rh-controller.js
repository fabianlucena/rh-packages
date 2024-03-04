import {corsSimplePreflight, asyncHandler} from 'http-util';
import express from 'express';
import dasherize from 'dasherize';

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

        const with__permission = methodName + '__permission';
        if (this[with__permission]) {
            params.push(checkPermission(this[with__permission]));
        }

        const withMiddleware = methodName + 'Middleware';
        if (this[withMiddleware]) {
            params.push(this[withMiddleware]);
        }


        const with__middleware = methodName + '__middleware';
        if (this[with__middleware]) {
            params.push(this[with__middleware]);
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
