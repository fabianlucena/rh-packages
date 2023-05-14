import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhAccess';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Access',
    version: '0.1',
    schema: 'acc',
    init: [],
    configure: null,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        roles: [
            {name: 'authorizedUserManager',      title: loc._f('Authorized users manager'), isTranslatable: true, ownerModule: name},
        ],

        shareTypes: [
            {name: 'owner',  title: loc._f('Owner')},
            {name: 'editor', title: loc._f('Editor')},
            {name: 'viewer', title: loc._f('Viewer')},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'authorizedUserManager', site: 'system', ownerModule: name},
        ],

        usersRolesSites: [
            {username: 'admin', role: 'admin', site: 'system'},
        ],

        permissions: [
            {name: 'authorized-user.create', title: loc._f('Add an authorized user'),   isTranslatable: true, roles: 'authorizedUserManager', ownerModule: name},
            {name: 'authorized-user.get',    title: loc._f('Get authorized users'),     isTranslatable: true, roles: 'authorizedUserManager', ownerModule: name, menuItem: {label: loc._f('Authorized users'), isTranslatable: true, action: 'grid',   service: 'authorized-user'}},
            {name: 'authorized-user.edit',   title: loc._f('Edit authorized users'),    isTranslatable: true, roles: 'authorizedUserManager', ownerModule: name},
            {name: 'authorized-user.delete', title: loc._f('Delete authorized users'),  isTranslatable: true, roles: 'authorizedUserManager', ownerModule: name},

            {name: 'privileges',             title: loc._f('Privileges'),               isTranslatable: true, roles: 'everybody',             ownerModule: name, menuItem: {parent: 'session-menu',                                  action: 'object', service: 'privileges'}},
        ],
    },
};
