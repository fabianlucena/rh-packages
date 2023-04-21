import {locale as l} from 'rofa-util';
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
            'public':    {title: l._f('Public')},
            'private':   {title: l._f('Private')},
            'anonymous': {title: l._f('Anonymous')},
        },

        userRoleSites: {
            'user:admin,role:admin,site:system': {username: 'admin', role: 'admin', site: 'system'},
        },
    },
};
