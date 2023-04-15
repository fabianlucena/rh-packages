import {locale as l} from 'rofa-util';
import url from 'url';
import path from 'path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const name = 'rhAuth';

export const conf = {
    name: name,
    title: 'Authorization',
    version: '0.1',
    schema: 'auth',
    init: [],
    routesPath: dirname + '/routes',
    routesPathOptions: {exclude: /login\.js$/},
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
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
