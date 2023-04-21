import {locale as l, setUpError, errorHandlerAsync} from 'rofa-util';
import * as uuid from 'uuid';
import fs from 'fs';
import path from 'path';

export class HttpError extends Error {
    constructor(message, statusCode, ...params) {
        super();
        setUpError(
            this,
            {
                message,
                statusCode,
                params
            }
        );
    }
}

export class _HttpError extends Error {
    constructor(message, statusCode, ...params) {
        super();
        setUpError(
            this,
            {
                _message: message,
                statusCode,
                params
            }
        );
    }
}

export class UnauthorizedError extends Error {
    static VisibleProperties = ['message'];

    statusCode = 401;

    constructor(_message, options, ...params) {
        super();
        setUpError(
            this,
            {
                _message,
                options,
                params
            }
        );
    }
}

export class NoPermissionError extends Error {
    static NoObjectValues = ['permissions'];
    static VisibleProperties = ['message', 'permissions'];
    static _zeroMessage = l._f('You do not have permission.');
    static _message = l._nf(0, 'You do not have permission: "%s"', 'You do not have any of permissions: "%s".');

    statusCode = 403;
    permissions = [];

    constructor(permissions, options, ...params) {
        super();
        setUpError(
            this,
            {
                permissions,
                options,
                params
            }
        );
    }

    _n() {return this.permissions.length;}

    async getMessageParamsAsync(locale) {
        return [await locale._or(...this.permissions)];
    }
}

export class MethodNotAllowedError extends Error {
    static NoObjectValues = ['method'];
    static VisibleProperties = ['message', 'method'];
    static _message = l._f('Method "%s" not allowed.');
    static param = ['<unknown>'];

    statusCode = 405;
    method = '';

    constructor(method) {
        super();
        setUpError(
            this,
            {
                method
            }
        );
    }

    // eslint-disable-next-line no-unused-vars
    async getMessageParamsAsync(locale) {
        return [this.method];
    }
}

export class NoUUIDError extends Error {
    static NoObjectValues = ['paramName'];
    static VisibleProperties = ['message', 'paramName'];
    static _message = l._f('The "%s" parameter is not a valid UUID.');
    static param = ['<unknown>'];

    statusCode = 403;

    constructor(paramName) {
        super();
        setUpError(this, {paramName});
    }
}

export class ConflictError extends Error {
    static VisibleProperties = ['message'];
    static _message = l._f('Conflict.');

    statusCode = 409;

    constructor() {
        super();
        setUpError(this);
    }
}

export const maxRowsInResult = 100;
export const defaultRowsInResult = 20;
export const defaultGlobal = {
    app: null,
    router: null,
    sequelize: null,
    beforeConfig: [],
    afterConfigAsync: []
};

export async function httpUtilConfigureAsync(global, ...modules) {
    if (!global)
        global = defaultGlobal;

    if (global.checkRoutePermission === undefined) {
        if (global.checkPermissionHandler === undefined)
            global.checkPermissionHandler = async () => {};

        global.checkRoutePermission = (...permission) => (req, res, next) => {
            global.checkPermissionHandler(req, ...permission)
                .then(() => next())
                .catch(e => next(e));
        };
    }

    if (!global.sequelize.Sequelize && global.Sequelize)
        global.sequelize.Sequelize = global.Sequelize;

    if (!global.models) {
        global.models = global.sequelize.models;
        if (!global.models)
            global.models = {};
    }

    await beforeConfigAsync(global);
    await configureModulesAsync(global, modules);
    await beforeSyncAsync(global);
    await syncDBAsync(global);
    if (global.postConfigureModels)
        global.postConfigureModels(global.sequelize);
    await afterSyncAsync(global);
    await afterConfigAsync(global);
    
    configureSwagger(global);
}

export function methodNotAllowed(req) {
    throw new MethodNotAllowedError(req.method);
}

export function configureRouter(routesPath, router, checkPermission, options) {
    if (!router)
        return;

    if (!routesPath)
        return;

    if (!fs.existsSync(routesPath))
        throw new Error(`The routes path does not exists: ${routesPath}`);
        
    fs
        .readdirSync(routesPath)
        .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)))
        .forEach(async file => {
            const fullFile = 'file://' + path.join(routesPath, file);
            const modulusRouter = (await import(fullFile)).default;
            modulusRouter(router, checkPermission);
        });
}

export function configureServices(services, servicesPath, options) {
    if (!servicesPath)
        return;
        
    fs
        .readdirSync(servicesPath)
        .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)))
        .forEach(async file => {
            const modules = await import('file://' + path.join(servicesPath, file));
            for (let k in modules) {
                let module = modules[k];
                let name = k;
                let l = name.length;
                if (l > 7 && name.substring(l - 7) === 'Service')
                    name = name.substring(0, l - 7);

                services[name] = module;
            }
        });
}

export async function sendErrorAsync(req, res, error) {
    const data = await errorHandlerAsync(error, req.locale, req.showErrorInConsole);
    if (data.stack)
        delete data.stack;
    res.status(data.statusCode ?? 500).send(data);
}

export function httpErrorHandlerAsync(req, res) {
    return async error => await sendErrorAsync(req, res, error);
}

export function asyncHandler(method) {
    return async (req, res, next) => {
        try {
            await method(req, res, next);
        }
        catch(err) {
            next(err);
        }
    };
}

export async function getOptionsFromODataAsync(params, options) {
    if (!options)
        options = {};

    if (params) {
        if (params.$select) {
            if (!options.attributes)
                options.attributes = [];

            params.$select.split(',')
                .forEach(column => options.attributes.push(column.trim()));
        }

        if (params.$top) {
            const limit = parseInt(params.$top);
            if (isNaN(limit))
                throw new _HttpError(l._fp('Error to convert $top = "%s" parameter value to a integer number.', params.$top));

            if (limit > maxRowsInResult)
                throw new _HttpError(l._fp('Too many rows to return, please select a lower number (at most %s) for $top parameter.', maxRowsInResult));
    
            if (limit > options.maxLimit)
                throw new _HttpError(l._fp('Too many rows to return, please select a lower number (at most %s) for $top parameter.', options.maxLimit));
    
            if (limit < 0)
                throw new _HttpError(l._fp('The $top parameter cannot be negative.'), 400);

            options.limit = limit;
        }

        if (!options.limit)
            options.limit = defaultRowsInResult;
    
        if (params.$skip) {
            const offset = parseInt(params.$skip);
            if (isNaN(offset))
                throw new _HttpError(l._fp('Error to convert $skip = "%s" parameter value to a integer number.', params.$skip));

            if (offset < 0)
                throw new _HttpError(l._f('The $skip param cannot be negative.'), 400);
            
            options.offset = offset;
        }

        if (!options.offset)
            options.offset = 0;
    }

    return options;
}

export async function getWhereOptionsFromParamsAsync(params, definitions, options) {
    if (!options)
        options = {};

    if (params && definitions) {
        for(const name in definitions) {
            const value = params[name];
            if (value !== undefined) {
                const def = definitions[name];
                switch (def) {
                case 'uuid':
                    if (!uuid.validate(params.uuid))
                        throw new NoUUIDError(name);
                }
            
                if (!options.where)
                    options.where = {};

                options.where[name] = value;
            }
        }
    }

    return options;
}

export async function getOptionsFromParamsAndODataAsync(params, definitions, options) {
    options = await getOptionsFromODataAsync(params, options);
    return await getWhereOptionsFromParamsAsync(params, definitions, options);
}

export async function deleteHandlerAsync(req, res, rowCount) {
    if (!rowCount)
        res.status(200).send({msg: await req.locale._('Nothing to delete.')});
    else if (rowCount != 1)
        res.status(200).send({msg: await req.locale._('%s rows deleted.', rowCount)});
    else
        res.sendStatus(204);
}

export function getDeleteHandler(req, res) {
    return async rowCount => deleteHandlerAsync(req, res, rowCount);
}

export async function execAsyncMethodListAsync(asyncMethodList, singleItemName, ...params) {
    let method,
        isEmpty,
        itemName;
    if (asyncMethodList instanceof Array) {
        if (!asyncMethodList.length)
            return;

        itemName = singleItemName;
        if (singleItemName === undefined || singleItemName === null || singleItemName < 0 || singleItemName >= asyncMethodList.length)
            itemName = 0;

        method = asyncMethodList.splice(itemName, 1)[0];
        isEmpty = !asyncMethodList.length;
    } else {
        itemName = singleItemName;
        if (itemName === undefined || itemName === null) {
            for (let name in asyncMethodList) {
                if (typeof asyncMethodList[name] == 'function') {
                    itemName = name;
                    break;
                }
            }

            if (!itemName)
                return;
        }

        method = asyncMethodList[itemName];
        delete asyncMethodList[itemName];

        isEmpty = !Object.keys(asyncMethodList).length;
    }

    if (!method)
        return;

    await method(asyncMethodList, ...params);
    if (isEmpty || (singleItemName !== undefined && singleItemName !== null))
        return;
            
    return await execAsyncMethodListAsync(asyncMethodList, null, ...params);
}

export async function configureModuleAsync(global, theModule) {
    if (typeof theModule === 'string')
        theModule = (await import(theModule)).conf;

    if (!theModule.name)
        throw new Error('Module does not have a name.');

    global.modules[theModule.name] = theModule;
    theModule.global = global;

    if (theModule.configure)
        await theModule.configure(global);

    if (theModule.modelsPath && global.configureModelsAsync)
        await global.configureModelsAsync(theModule.modelsPath, global.sequelize);

    if (theModule.servicesPath)
        await configureServices(global.services, theModule.servicesPath);

    if (theModule.schema && global.createSchema)
        await global.createSchema(theModule.schema);

    if (theModule.data)
        global.data = {...global.data, ...theModule.data};

    return theModule;
}

export async function installModuleAsync(global, theModule) {
    theModule.global = global;
    if (theModule.routesPath)
        await configureRouter(theModule.routesPath, global.router, global.checkRoutePermission, theModule.routesPathOptions);

    if (theModule.data)
        global.data = {...global.data, ...theModule.data};

    if (theModule.init)
        await Promise.all(await theModule.init.map(async method => await method()));

    if (theModule.afterConfigAsync) {
        const afterConfigAsync = (theModule.afterConfigAsync instanceof Array)?
            theModule.afterConfigAsync:
            [theModule.afterConfigAsync];
        
        global.afterConfigAsync.push(...afterConfigAsync);
    }
}

export async function configureModulesAsync(global, modules) {
    if (!global.modules)
        global.modules = {};

    if (!global.services)
        global.services = {};
            
    if (!global.data)
        global.data = {};

    for (let i = 0, e = modules.length; i < e; i++)
        modules[i] = await configureModuleAsync(global, modules[i]);

    if (global.posConfigureModelsAssociationsAsync)
        await global.posConfigureModelsAssociationsAsync(global.sequelize);
    
    for (let i = 0, e = modules.length; i < e; i++)
        await installModuleAsync(global, modules[i]);
}

export function getPropertyFromItems(propertyName, list) {
    if (list instanceof Array) {
        const checkList = [];
        list.forEach(item => {
            const v = item[propertyName];
            if (v !== undefined)
                checkList.push(v);
        });

        return checkList;
    } else {
        const checkList = {};
        for (let name in list) {
            const item = list[name];
            const v = item[propertyName];
            if (v !== undefined)
                checkList[name] = v;
        }

        return checkList;
    }
}

export async function beforeConfigAsync(global) {
    await execAsyncMethodListAsync(global.beforeConfigAsync);
}

export async function afterConfigAsync(global) {
    await execAsyncMethodListAsync(global.afterConfigAsync, null, global);
}

export async function beforeSyncAsync(global) {
    if (global.sequelize) {
        const list = getPropertyFromItems('beforeSyncAsync', global.modules);
        await execAsyncMethodListAsync(list);
    }
}

export async function afterSyncAsync(global) {
    if (global.sequelize) {
        const list = getPropertyFromItems('afterSyncAsync', global.modules);
        await execAsyncMethodListAsync(list);
    }
}

export async function syncDBAsync(global) {
    if (!global.sequelize)
        return;

    await global.sequelize.sync(global?.config?.db?.sync);
    const asyncMethodList = getPropertyFromItems('check', global.sequelize.models);
    await execAsyncMethodListAsync(asyncMethodList);
}

export function configureSwagger(global) {
    if (!global.swagger)
        return;
        
    let swaggerJSDoc;
    import('swagger-jsdoc')
        .then(module => {
            swaggerJSDoc = module.default;
            return import('swagger-ui-express');
        })
        .then(swaggerUI => {
            let apis = [];
            for (const moduleName in global.modules) {
                const module = global.modules[moduleName];
                if (module.apis)
                    apis.push(...module.apis);
            }

            const swaggerDocs = swaggerJSDoc({
                swaggerDefinition: {
                    info: {
                        title:'Rofa HTTP API',
                        version:'1.0.0',
                        descrition: 'System to use accontable accounts'
                    },
                    securityDefinitions: {
                        bearerAuth: {
                            description: 'Enter token in format (Bearer &lt;token&gt;)',
                            type: 'apiKey',
                            in: 'header',
                            name: 'Authorization',
                            scheme: 'bearer',
                        }
                    }
                },
                apis: apis
            });

            global.app.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
        });
}

export function cookies(response, cookieName, cookieProperty) {
    const list = {};
    let cookieHeader = response;
    if (!cookieHeader)
        return list;

    if (cookieHeader.headers) {
        cookieHeader = cookieHeader.headers;
        if (!cookieHeader)
            return list;
    }
    
    if (cookieHeader['set-cookie']) {
        cookieHeader = cookieHeader['set-cookie'];
        if (!cookieHeader)
            return list;
    }

    cookieHeader.forEach(cookieData => {
        const cookieProps = cookieData.split(';');

        let [name, ...rest] = cookieProps[0].split('=');
        name = name?.trim();
        if (!name)
            return;

        const value = rest.join('=').trim();
        if (!value)
            return;

        const cookie = {
            value: decodeURIComponent(value),
        };

        cookieProps.slice(1).forEach(prop => {
            let [name, ...rest] = prop.split('=');
            name = name?.trim();
            if (!name)
                return;

            let value = rest.join('=').trim();
            if (!value)
                return;
            
            if (name === 'Expires')
                value = new Date(value);
            else
                value = decodeURIComponent(value);

            cookie[name] = decodeURIComponent(value);
        });

        list[name] = cookie;
    });

    let result = list;

    if (result) {
        if (cookieName)
            result = result[cookieName];

        if (result) {
            if (cookieProperty)
                result = result[cookieProperty];
        }
    }

    return result;
}

export function corsMiddleware(...origins) {
    return (req, res, next) => {
        const requestOrigin = req.header('origin');
        for (let i = 0, e = origins.length; i < e; i++) {
            const origin = origins[i];
            if (origin === requestOrigin) {
                res.header('Access-Control-Allow-Origin', origin);
                break;
            }
        }

        next();
    };
}