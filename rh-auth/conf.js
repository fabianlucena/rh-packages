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
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        userTypes: [
            {name: 'user',  title: loc._f('User'),  ownerModule: name},
            {name: 'group', title: loc._f('Group'), ownerModule: name},
        ],

        users: [
            {username: 'admin', displayName: loc._f('Administrator'), ownerModule: name},
        ],

        identityTypes: [
            {name: 'local', title: loc._f('Local')},
        ],

        identities: [
            {username: 'admin', type: 'local', data: '{"password":"da842b69d8f584f01700f64af185fd59:cd3569832703bf38d0ad86ed9f2ae95e1f385ba998e630a5032523d19405901886aad13b5f9edd6b6acfae7861109baab9c52020338c753d24e8f0a11fea4c45"}' /* password: 1234 */ },
        ],

        roles: [
            {name: 'everybody',   title: loc._f('Everybody'),            ownerModule: name},
            {name: 'anonymous',   title: loc._f('Anonymous'),            ownerModule: name},
            {name: 'user',        title: loc._f('User'),                 ownerModule: name},
            {name: 'admin',       title: loc._f('System administrator'), ownerModule: name},
            {name: 'userManager', title: loc._f('User manager'),         ownerModule: name},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'userManager', site: 'system', ownerModule: name},
        ],

        permissions: [
            {name: 'login',          title: loc._f('Login'),                 roles: 'anonymous',   ownerModule: name, menuItem: {name: 'login',          label: loc._f('Login'),       parent: 'session-menu', action: 'form',    service: 'login'}},
            {name: 'logout',         title: loc._f('Logout'),                roles: 'user',        ownerModule: name, menuItem: {name: 'logout',         label: loc._f('Logout'),      parent: 'session-menu', action: 'apiCall', service: 'logout', method: 'post', onSuccess: 'clearBearerAuthorization(); reloadMenu();'}},
            {name: 'user.get',       title: loc._f('Get user(s)'),           roles: 'userManager', ownerModule: name, menuItem: {name: 'user.get',       label: loc._f('Users'),                               action: 'grid',    service: 'user'}},
            {name: 'user.create',    title: loc._f('Create user'),           roles: 'userManager', ownerModule: name,},
            {name: 'user.edit',      title: loc._f('Edit user'),             roles: 'userManager', ownerModule: name,},
            {name: 'user.delete',    title: loc._f('Delete user'),           roles: 'userManager', ownerModule: name,},
            {name: 'session.get',    title: loc._f('Get session(s)'),        roles: 'userManager', ownerModule: name, menuItem: {name: 'session.get',    label: loc._f('Sessions'),                            action: 'grid',    service: 'session'}},
            {name: 'session.delete', title: loc._f('Delete session'),        roles: 'userManager', ownerModule: name,},
            {name: 'ownsession.get', title: loc._f('Get own sessions only'), roles: 'user',        ownerModule: name, menuItem: {name: 'ownsession.get', label: loc._f('My sessions'), parent: 'session-menu', action: 'grid',    service: 'session'}},
        ]
    },
};
