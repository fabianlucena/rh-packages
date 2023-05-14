import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const name = 'rhAuth';

export const conf = {
    name,
    title: 'Authorization',
    version: '0.1',
    schema: 'auth',
    init: [],
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    controllersPath: dirname + '/controllers',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        userTypes: [
            {name: 'user',  title: loc._f('User'),  isTranslatable: true, ownerModule: name},
            {name: 'group', title: loc._f('Group'), isTranslatable: true, ownerModule: name},
        ],

        users: [
            {username: 'admin', displayName: loc._f('Administrator'), isTranslatable: true, ownerModule: name},
        ],

        identityTypes: [
            {name: 'local', title: loc._f('Local'), isTranslatable: true},
        ],

        identities: [
            {username: 'admin', type: 'local', password: '1234'},
        ],

        roles: [
            {name: 'everybody',   title: loc._f('Everybody'),            isTranslatable: true, ownerModule: name},
            {name: 'anonymous',   title: loc._f('Anonymous'),            isTranslatable: true, ownerModule: name},
            {name: 'user',        title: loc._f('User'),                 isTranslatable: true, ownerModule: name},
            {name: 'admin',       title: loc._f('System administrator'), isTranslatable: true, ownerModule: name},
            {name: 'userManager', title: loc._f('User manager'),         isTranslatable: true, ownerModule: name},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'userManager', site: 'system', ownerModule: name},
        ],

        permissions: [
            {name: 'login',          title: loc._f('Login'),                 isTranslatable: true, roles: 'anonymous',   ownerModule: name, menuItem: {                                                    parent: 'session-menu', action: 'form',    service: 'login'}},
            {name: 'logout',         title: loc._f('Logout'),                isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {                                                    parent: 'session-menu', action: 'apiCall', service: 'logout', method: 'post', onSuccess: 'clearBearerAuthorization(); reloadMenu();'}},
            {name: 'user.get',       title: loc._f('Get user(s)'),           isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._f('Users'),       isTranslatable: true,                         action: 'grid',    service: 'user'}},
            {name: 'user.create',    title: loc._f('Create user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'user.edit',      title: loc._f('Edit user'),             isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'user.delete',    title: loc._f('Delete user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'session.get',    title: loc._f('Get session(s)'),        isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._f('Sessions'),    isTranslatable: true,                         action: 'grid',    service: 'session'}},
            {name: 'session.delete', title: loc._f('Delete session'),        isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'ownsession.get', title: loc._f('Get own sessions only'), isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._f('My sessions'), isTranslatable: true, parent: 'session-menu', action: 'grid',    service: 'session'}},
        ]
    },
};
