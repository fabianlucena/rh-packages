const conf = {
    name: 'rhModule',
    title: 'Modules',
    version: '0.1',
    schema: 'module',
    routesPath: __dirname + '/routes',
    modelsPath: __dirname + '/models',
    servicesPath: __dirname + '/services',
    apis: [__dirname + '/routes/*.js', __dirname + '/controllers/*.js'],
    afterConfig: afterConfig,
};

async function afterConfig() {
    const ModuleService = require('./services/module');
    for (const moduleName in conf?.global?.modules)
        await ModuleService.createIfNotExists(conf.global.modules[moduleName]);
}

module.exports = conf;