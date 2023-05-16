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
            {name: 'userAccessManager', title: loc._f('User access manager'), isTranslatable: true, ownerModule: name},
        ],

        shareTypes: [
            {name: 'owner',  title: loc._f('Owner')},
            {name: 'editor', title: loc._f('Editor')},
            {name: 'viewer', title: loc._f('Viewer')},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'userAccessManager', site: 'system', ownerModule: name},
        ],

        usersSitesRoles: [
            {username: 'admin', role: 'admin', site: 'system'},
        ],

        permissions: [
            {name: 'user-access.create', title: loc._f('Add users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name},
            {name: 'user-access.get',    title: loc._f('Get users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name, menuItem: {label: loc._f('Users accesses'), isTranslatable: true, action: 'grid',   service: 'user-access'}},
            {name: 'user-access.edit',   title: loc._f('Edit users accesses'),   isTranslatable: true, roles: 'userAccessManager', ownerModule: name},
            {name: 'user-access.delete', title: loc._f('Delete users accesses'), isTranslatable: true, roles: 'userAccessManager', ownerModule: name},

            {name: 'privileges',         title: loc._f('Privileges'),            isTranslatable: true, roles: 'everybody',         ownerModule: name, menuItem: {parent: 'session-menu',                                action: 'object', service: 'privileges'}},
        ],
    },
};
