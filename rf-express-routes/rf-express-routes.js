import express from 'express';

export function installRoutes(masterRouter, routes, options) {
    options ??= {};

    let router = masterRouter;
    if (routes.path) {
        router = express.Router();
        masterRouter.use(routes.path, router);
    }

    for (const route of routes.routes) {
        const params = [];
        if (options.checkPermission && route.permission) {
            params.push(options.checkPermission(route.permission));
        }

        if (route.middleware) {
            params.push(route.middleware);
        }

        const handler = getHandler(route, routes);
        params.push(execHandler(handler));

        router[route.httpMethod](route.path, ...params);
    }

    return router;
}


function getHandler(route, routes) {
    if (route.handler) {
        if (typeof route.handler !== 'function') {
            throw new Error('Error in route handler definition, handler is not a function.');
        }

        return route.handler;
    }

    const method = route.method;
    if (!method) {
        throw new Error('Error in route handler definition, no method defined.');
    }

    const controller = route.controller ?? routes.controller;
    if (!controller) {
        if (typeof method !== 'function') {
            throw new Error('Error in route handler definition, method is not a function, and no controller provided.');
        }

        return method;
    }
    
    if (typeof controller !== 'function' || controller.prototype === undefined) {
        throw new Error('Error in route handler definition, controller is not a class.');
    }

    if (typeof method === 'string') {
        if (method in controller.prototype) {
            return (req, res, next) => (new controller)[method](req, res, next);
        }

        if (method in controller) {
            return controller[method];
        }
        
        throw new Error('Error in route handler definition, method is not a method of controller.');
    }
    
    if (typeof method !== 'function') {
        throw new Error('Error in route handler definition, method is not a function or a string.');
    }

    if (route.isStaticMethod) {
        return method;
    }

    return async (req, res, next) => await (new controller).call(method, req, res, next);
}

function execHandler(handler) {
    return async (req, res, next) => {
        try {
            const result = await handler(req, res, next);
            if (result) {
                res.send(result);
            }

            res.end();
        } catch(err) {
            next(err);
        }
    };
}
