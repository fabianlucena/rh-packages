import {loc} from 'rf-locale';
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
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        roles: {
            'admin':       {title: loc._f('System administrator'), ownerModule: name},
            'userManager': {title: loc._f('User manager'),         ownerModule: name},
            'user':        {title: loc._f('User'),                 ownerModule: name},
        },

        rolesParentsSites: {
            'role:admin,parent:userManager,site:system': {role: 'admin', parent: 'userManager', site: 'system', ownerModule: name},
        },

        

        permissions: {
            'login':          {title: loc._f('Login'),                 type: 'anonymous',                       ownerModule: name, menuItem: {name: 'login',          label: loc._f('Login'),       parent: 'session-menu', action: 'form',    service: 'login'}},
            'logout':         {title: loc._f('Logout'),                type: 'global',                          ownerModule: name, menuItem: {name: 'logout',         label: loc._f('Logout'),      parent: 'session-menu', action: 'apiCall', service: 'logout', method: 'post', onSuccess: 'clearBearerAuthorization(); reloadMenu();'}},
            'user.get':       {title: loc._f('Get user(s)'),           type: 'private',   roles: 'userManager', ownerModule: name, menuItem: {name: 'user.get',       label: loc._f('Users'),                               action: 'grid',    service: 'user'}},
            'user.create':    {title: loc._f('Create user'),           type: 'private',   roles: 'userManager', ownerModule: name,},
            'user.delete':    {title: loc._f('Delete user'),           type: 'private',   roles: 'userManager', ownerModule: name,},
            'session.get':    {title: loc._f('Get session(s)'),        type: 'private',   roles: 'userManager', ownerModule: name, menuItem: {name: 'session.get',    label: loc._f('Sessions'),                            action: 'grid',    service: 'session'}},
            'session.delete': {title: loc._f('Delete session'),        type: 'private',   roles: 'userManager', ownerModule: name,},
            'ownsession.get': {title: loc._f('Get own sessions only'), type: 'global',                          ownerModule: name, menuItem: {name: 'ownsession.get', label: loc._f('My sessions'), parent: 'session-menu', action: 'grid',    service: 'session'}},
        }
    },
};
