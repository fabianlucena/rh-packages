const name = 'rhLocale';

const conf = {
    name: name,
    title: 'Locale',
    version: '0.1',
    schema: 'locale',
    configure: configure,
    routesPath: __dirname + '/routes',
    modelsPath: __dirname + '/models',
    servicesPath: __dirname + '/services',
    apis: [__dirname + '/routes/*.js', __dirname + '/controllers/*.js'],
};

function configure(global) {
    if (global.router) {
        const locale = require('./controllers/locale');
        global.router.use(locale.middleware());
    }
}

module.exports = conf;