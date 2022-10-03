const ru = require('rofa-util');
const l = ru.locale;

const name = 'rhAuth';

const conf = {
    name: name,
    title: 'Authorization',
    version: '0.1',
    schema: 'auth',
    configure: configure,
    init: [],
    routesPath: __dirname + '/routes',
    routesPathOptions: {exclude: /login\.js$/},
    modelsPath: __dirname + '/models',
    servicesPath: __dirname + '/services',
    apis: [__dirname + '/routes/*.js', __dirname + '/controllers/*.js'],
    data: {
        roles: {
            'admin':       {title: l._f('System administrator'), module: name},
            'userManager': {title: l._f('User manager'),         module: name},
            'user':        {title: l._f('User'),                 module: name},
        },
        
        permissions: {
            'login':          {title: l._f('Login'),                 type: 'public',  roles: 'user',        module: name, menuItem: {name: 'login',          title: l._f('Login'),       service: 'login',   action: 'form'}},
            'logout':         {title: l._f('Logout'),                type: 'public',  roles: 'user',        module: name, menuItem: {name: 'logout',         title: l._f('Logout'),      service: 'logout',  action: 'get'}},
            'user.get':       {title: l._f('Get user(s)'),           type: 'private', roles: 'userManager', module: name, menuItem: {name: 'user.get',       title: l._f('Users'),       service: 'user',    action: 'form'}},
            'user.create':    {title: l._f('Create user'),           type: 'private', roles: 'userManager', module: name,},
            'user.delete':    {title: l._f('Delete user'),           type: 'private', roles: 'userManager', module: name,},
            'session.get':    {title: l._f('Get session(s)'),        type: 'private', roles: 'userManager', module: name, menuItem: {name: 'session.get',    title: l._f('Sessions'),    service: 'session', action: 'form'}},
            'session.delete': {title: l._f('Delete session'),        type: 'private', roles: 'userManager', module: name,},
            'ownsession.get': {title: l._f('Get own sessions only'), type: 'public',  roles: 'user',        module: name, menuItem: {name: 'ownsession.get', title: l._f('My sessions'), service: 'session', action: 'form'}},
        }
    },
};

function configure(global) {
    require('./services/device');
    require('./services/session');

    if (global.router) {
        const device = require('./controllers/device');

        global.router.use(device.middleware({cookieName: 'device'}));
        
        require('./routes/login.js')(global.router, global.checkRoutePermission);

        const express = require('express');
        const session = require('./controllers/session');
        const router = express.Router();
        router.use(session.middleware());

        global.router.use('/', router);
        global.router = router;
    }
}

module.exports = conf;
