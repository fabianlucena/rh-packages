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

        if (route.handler) {
            params.push(asyncHandler(route.handler));
        } else {
            params.push(asyncHandler(route.controller ?? routes.controller, route.method, route.methodIsStatic));
        }

        router[route.httpMethod](route.path, ...params);
    }

    return router;
}

function asyncHandler(controller, method, isStatic) {
    return async (req, res, next) => {
        try {
            if (!controller) {
                throw new Error('No method defined.');
            }

            let result;

            if (method) {
                if (typeof method === 'string') {
                    if (isStatic) {
                        result = await controller[method](req, res, next);
                    } else {
                        result = await (new controller)[method](req, res, next);
                    }
                } else if (typeof method === 'function') {
                    if (isStatic) {
                        result = await controller.call(method, req, res, next);
                    } else {
                        result = await (new controller).call(method, req, res, next);
                    }
                } else {
                    throw new Error('Error in method definition.');
                }
            } else {
                result = await controller(req, res, next);
            }

            if (result) {
                res.send(result);
            }

            res.end();
        } catch(err) {
            next(err);
        }
    };
}