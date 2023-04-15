import {locale as l} from 'rofa-util';
import url from 'url';
import path from 'path';

const name = 'rhPermission';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name: name,
    title: 'Permission',
    version: '0.1',
    schema: 'acc',
    init: [],
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        permissions: {
            'current-site.switch': {title: l._f('Switch site'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
            'current-site.get':    {title: l._f('Get current site'), type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'get'}},
            'site.get':            {title: l._f('Get site(s)'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
        },
    },
};
