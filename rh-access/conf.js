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
        permissionTypes: {
            'public':    {title: loc._f('Public')},
            'private':   {title: loc._f('Private')},
            'anonymous': {title: loc._f('Anonymous')},
            'global':    {title: loc._f('Global')},
        },

        usersRolesSites: {
            'user:admin,role:admin,site:system': {username: 'admin', role: 'admin', site: 'system'},
        },

        permissions: {
            'privileges': {title: loc._f('Privileges'), type: 'global', ownerModule: name, menuItem: {name: 'privileges', label: loc._f('Privileges'), parent: 'session-menu', action: 'object', service: 'privileges'}},
        },
    },
};
