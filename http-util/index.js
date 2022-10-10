const ru = require('rofa-util');
const uuid = require('uuid');
const l = ru.locale;

class HttpError extends Error {
    constructor(message, statusCode, ...params) {
        super();
        ru.setUpError(
            this,
            {
                message: message,
                statusCode: statusCode,
                params: params
            }
        );
    }
}

class _HttpError extends Error {
    constructor(message, statusCode, ...params) {
        super();
        ru.setUpError(
            this,
            {
                _message: message,
                statusCode: statusCode,
                params: params
            }
        );
    }
}

class NoPermissionError extends Error {
    static NoObjectValues = ['permissions'];
    static VisibleProperties = ['message', 'permissions'];
    static _zeroMessage = l._f('You do not have permission.');
    static _message = l._nf(0, 'You do not have permission: "%s"', 'You do not have any of permissions: "%s".');

    statusCode = 403;
    permissions = [];

    constructor(permissions, options, ...params) {
        super();
        ru.setUpError(
            this,
            {
                permissions: permissions,
                options: options,
                params: params
            }
        );
    }

    _n() {return this.permissions.length;}

    async getMessageParams(locale) {
        return [await locale._or(...this.permissions)];
    }
}

class MethodNotAllowedError extends Error {
    static NoObjectValues = ['methods'];
    static VisibleProperties = ['message', 'methods'];
    static _zeroMessage = l._f('Method not allowed.');
    static _message = l._nf(0, 'Method "%s" not allowed.', 'Methods "%s" not allowed.');
    static param = ['<unknown>'];

    statusCode = 405;
    methods = [];

    constructor(...methods) {
        super();
        ru.setUpError(
            this,
            {
                methods: methods
            }
        );
    }

    _n() {return this.methods.length;}

    async getMessageParams(locale) {
        return [await locale._or(...this.methods)];
    }
}

class NoUUIDError extends Error {
    static NoObjectValues = ['paramName'];
    static VisibleProperties = ['message', 'paramName'];
    static _message = l._f('The "%s" parameter is not a valid UUID.');
    static param = ['<unknown>'];

    statusCode = 403;

    constructor(paramName) {
        super();
        ru.setUpError(
            this,
            {
                paramName: paramName
            }
        );
    }
}

const httpUtil = {
    maxRowsInResult: 100,
    defaultRowsInResult: 20,

    HttpError: HttpError,
    _HttpError: _HttpError,
    NoPermissionError: NoPermissionError,
    MethodNotAllowedError: MethodNotAllowedError,
    NoUUIDError: NoUUIDError,

    defaultGlobal: {
        app: null,
        router: null,
        sequelize: null,
        beforeConfig: [],
        afterConfig: []
    },

    async configure(global, ...modules) {
        if (!global)
            global = httpUtil.defaultGlobal;

        if (global.checkRoutePermission === undefined) {
            global.checkRoutePermission = (...permission) => (req, res, next) => {
                global.checkPermissionHandler(req, ...permission)
                    .then(() => next())
                    .catch(httpUtil.errorHandler(req, res));
            };
        }

        if (!global.sequelize.Sequelize && global.Sequelize)
            global.sequelize.Sequelize = global.Sequelize;

        if (!global.models) {
            global.models = global.sequelize.models;
            if (!global.models)
                global.models = {};
        }

        await httpUtil.beforeConfig(global);
        await httpUtil.configureModules(global, modules);
        await httpUtil.beforeSync(global);
        await httpUtil.syncDB(global);
        await httpUtil.afterSync(global);
        await httpUtil.afterConfig(global);

        await httpUtil.configureSwagger(global);
    },

    methodNotAllowed(req) {
        throw new httpUtil.MethodNotAllowedError(req.method);
    },

    configureRouter(routesPath, router, checkPermission, options) {
        if (!router)
            return;
    
        if (!routesPath)
            return;

        const fs = require('fs');
        const path = require('path');
            
        fs
            .readdirSync(routesPath)
            .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)))
            .forEach(file => require(path.join(routesPath, file))(router, checkPermission));
    },

    configureServices(services, servicesPath, options) {
        if (!servicesPath)
            return;

        const fs = require('fs');
        const path = require('path');
            
        fs
            .readdirSync(servicesPath)
            .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js' && (!options?.exclude || !options.exclude.test(file)))
            .forEach(file => services[ru.camelize(file.substring(0, file.length - 3))] = require(path.join(servicesPath, file)));
    },

    async sendError(req, res, error) {
        const data = await ru.errorHandler(error, req.locale, req.showErrorInConsole);
        res.status(data.statusCode ?? 500).send(data);
    },

    errorHandler(req, res) {
        return async error => httpUtil.sendError(req, res, error);
    },

    asyncHandler(method) {
        return async (req, res, next) => {
            try {
                await method(req, res, next);
            }
            catch(err) {
                next(err);
            }
        };
    },

    getOptionsFromOData(params, options) {
        return new Promise((resolve, reject) => {
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
                        return reject(new httpUtil._HttpError(l._fp('Error to convert $top = "%s" parameter value to a integer number.', params.$top)));

                    if (limit > httpUtil.maxRowsInResult)
                        return reject(new httpUtil._HttpError(l._fp('Too many rows to return, please select a lower number (at most %s) for $top parameter.', httpUtil.maxRowsInResult)));
            
                    if (limit > options.maxLimit)
                        return reject(new httpUtil._HttpError(l._fp('Too many rows to return, please select a lower number (at most %s) for $top parameter.', options.maxLimit)));
            
                    if (limit < 0)
                        return reject(new httpUtil._HttpError(l._fp('The $top parameter cannot be negative.'), 400));

                    options.limit = limit;
                }

                if (!options.limit)
                    options.limit = httpUtil.defaultRowsInResult;
            
                if (params.$skip) {
                    const offset = parseInt(params.$skip);
                    if (isNaN(offset))
                        return reject(new httpUtil._HttpError(l._fp('Error to convert $skip = "%s" parameter value to a integer number.', params.$skip)));

                    if (offset < 0)
                        return reject(new httpUtil._HttpError(l._f('The $skip param cannot be negative.'), 400));
                    
                    options.offset = offset;
                }

                if (!options.offset)
                    options.offset = 0;
            }

            resolve(options);
        });
    },

    getWhereOptionsFromParams(params, definitions, options) {
        return new Promise((resolve, reject) => {
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
                                return reject(new NoUUIDError(name));
                        }
                    
                        if (!options.where)
                            options.where = {};

                        options.where[name] = value;
                    }
                }
            }

            resolve(options);
        });
    },

    getOptionsFromParamsAndOData(params, definitions, options) {
        return httpUtil.getOptionsFromOData(params, options)
            .then(options => httpUtil.getWhereOptionsFromParams(params, definitions, options));
    },

    deleteHandler(req, res) {
        return async rowCount => {
            if (!rowCount)
                res.status(200).send({msg: await req.locale._('Nothing to delete.')});
            else if (rowCount != 1)
                res.status(200).send({msg: await req.locale._('%s rows deleted.', rowCount)});
            else
                res.sendStatus(204);
        };
    },

    async execAsyncMethodList(asyncMethodList, singleItemName, ...params) {
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
                
        return httpUtil.execAsyncMethodList(asyncMethodList, null, ...params);
    },

    async configureModule(global, theModule) {
        if (!theModule.name)
            throw new Error('Module does not have a name.');

        global.modules[theModule.name] = theModule;
        theModule.global = global;

        if (theModule.configure)
            await theModule.configure(global);

        if (theModule.modelsPath && global.configureModels)
            await global.configureModels(theModule.modelsPath, global.sequelize);

        if (theModule.servicesPath)
            await httpUtil.configureServices(global.services, theModule.servicesPath);

        if (theModule.schema && global.createSchema)
            await global.createSchema(theModule.schema);

        if (theModule.routesPath)
            await httpUtil.configureRouter(theModule.routesPath, global.router, global.checkRoutePermission, theModule.routesPathOptions);

        if (theModule.data)
            global.data = await ru.deepMerge(global.data, theModule.data);

        if (theModule.init)
            await Promise.all(await theModule.init.map(async method => await method()));

        if (theModule.afterConfig) {
            const afterConfig = (theModule.afterConfig instanceof Array)?
                theModule.afterConfig:
                [theModule.afterConfig];
            
            global.afterConfig.push(...afterConfig);
        }
    },

    async configureModules(global, modules) {
        ru.complete(
            global,
            {
                modules: {},
                services: {},
                data: {},
            }
        );

        for (let i = 0, e = modules.length; i < e; i++)
            await httpUtil.configureModule(global, modules[i]);
    },

    async getPropertyFromItems(propertyName, list) {
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
    },

    async beforeConfig(global) {
        await httpUtil.execAsyncMethodList(global.beforeConfig);
    },

    async afterConfig(global) {
        await httpUtil.execAsyncMethodList(global.afterConfig, null, global);
    },

    async beforeSync(global) {
        if (global.sequelize) {
            const list = await httpUtil.getPropertyFromItems('beforeSync', global.modules);
            await httpUtil.execAsyncMethodList(list);
        }
    },

    async afterSync(global) {
        if (global.sequelize) {
            const list = await httpUtil.getPropertyFromItems('afterSync', global.modules);
            await httpUtil.execAsyncMethodList(list);
        }
    },

    async syncDB(global) {
        if (!global.sequelize)
            return;

        await global.sequelize.sync();
        const asyncMethodList = await httpUtil.getPropertyFromItems('check', global.sequelize.models);
        await httpUtil.execAsyncMethodList(asyncMethodList);
    },

    async configureSwagger(global) {
        if (!global.swagger)
            return;
            
        const swaggerJSDoc = require('swagger-jsdoc');
        const swaggerUI = require('swagger-ui-express');

        let apis = [];
        for (const moduleName in global.modules) {
            const module = global.modules[moduleName];
            if (module.apis)
                apis.push(...module.apis);
        }

        const swaggerDocs = swaggerJSDoc({
            swaggerDefinition: {
                info: {
                    title:'Bookkeeper API',
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
    },
};

module.exports = httpUtil;