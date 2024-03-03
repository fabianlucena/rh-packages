import {corsSimplePreflight, asyncHandler} from 'http-util';
import express from 'express';
import dasherize from 'dasherize';

export class RHController {
    static installRouteForMethod(router, checkPermission, httpMethod, methodName) {
        methodName ??= httpMethod;
        if (!this[methodName]) {
            return;
        }

        const params = [];

        const withPermission = methodName + 'Permission';
        if (this[withPermission]) {
            params.push(checkPermission(this[withPermission]));
        }

        const withMiddleware = methodName + 'Middleware';
        if (this[withMiddleware]) {
            params.push(this[withMiddleware]);
        }

        params.push(asyncHandler(this, methodName));

        router[httpMethod]('', ...params);

        this.allMethods ??= [];
        this.allMethods.push(httpMethod.toUpperCase());
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

        this.installRouteForMethod(ownRouter, checkPermission, 'get', getMethod);
        this.installRouteForMethod(ownRouter, checkPermission, 'post');
        this.installRouteForMethod(ownRouter, checkPermission, 'patch');
        this.installRouteForMethod(ownRouter, checkPermission, 'put');
        this.installRouteForMethod(ownRouter, checkPermission, 'delete');
        this.installRouteForMethod(ownRouter, checkPermission, 'options');

        if (config?.server?.cors && !this.options) {
            ownRouter.options('', corsSimplePreflight(this.allMethods.join(',')));
        }

        this.installRouteForMethod(ownRouter, checkPermission, 'all');
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
