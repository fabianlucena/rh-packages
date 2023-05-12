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
        shareTypes: [
            {name: 'owner',  title: loc._f('Owner')},
            {name: 'editor', title: loc._f('Editor')},
            {name: 'viewer', title: loc._f('Viewer')},
        ],

        usersRolesSites: [
            {username: 'admin', role: 'admin', site: 'system'},
        ],

        permissions: [
            {name: 'privileges', title: loc._f('Privileges'), isTranslatable: true, roles: 'everybody', ownerModule: name, menuItem: {parent: 'session-menu', action: 'object', service: 'privileges'}},
        ],
    },
};
