'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhAccess';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Access',
    version: '0.1',
    schema: 'acc',
    init: [],
    configure: null,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        roles: [
            {name: 'userAccessManager', title: loc._cf('role', 'User access manager'), isTranslatable: true, ownerModule: name},
        ],

        shareTypes: [
            {name: 'owner',  title: loc._cf('shareType', 'Owner')},
            {name: 'editor', title: loc._cf('shareType', 'Editor')},
            {name: 'viewer', title: loc._cf('shareType', 'Viewer')},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'userAccessManager', site: 'system', ownerModule: name},
        ],

        usersSitesRoles: [
            {username: 'admin', role: 'admin', site: 'system'},
        ],

        permissions: [
            {name: 'user-access.create', title: loc._cf('permission', 'Add users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name},
            {name: 'user-access.get',    title: loc._cf('permission', 'Get users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Users accesses'), isTranslatable: true, action: 'grid',   service: 'user-access'}},
            {name: 'user-access.edit',   title: loc._cf('permission', 'Edit users accesses'),   isTranslatable: true, roles: 'userAccessManager', ownerModule: name},
            {name: 'user-access.delete', title: loc._cf('permission', 'Delete users accesses'), isTranslatable: true, roles: 'userAccessManager', ownerModule: name},

            {name: 'privileges',         title: loc._cf('permission', 'Privileges'),            isTranslatable: true, roles: 'user',              ownerModule: name, menuItem: {label: loc._cf('menu', 'Privileges'),     isTranslatable: true, action: 'object', service: 'privileges', parent: 'session-menu'}},
        ],
    },
};
