import {locale as l} from 'rofa-util';
import url from 'url';
import path from 'path';

const name = 'rhSiteModule';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Sites per Module',
    version: '0.1',
    schema: 'system',
    init: null,
    configure: null,
    //routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    //servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        permissions: {
            'current-site.switch': {title: l._f('Switch site'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
            'current-site.get':    {title: l._f('Get current site'), type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'get'}},
            'site.get':            {title: l._f('Get site(s)'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
        },
    },
};
