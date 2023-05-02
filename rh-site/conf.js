'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhSite';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Sites',
    version: '0.1',
    schema: 'syst',
    init: null,
    configure: null,
    //routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        sites: {
            'system': {title: loc._f('System'), ownerModule: name},
        },

        permissions: {
            'current-site.switch': {title: loc._f('Switch site'),      type: 'global', ownerModule: name, menuItem: {parent:'session-menu', action: 'object', service: 'site'}},
            'current-site.get':    {title: loc._f('Get current site'), type: 'global', ownerModule: name, menuItem: {parent:'session-menu', action: 'object', service: 'site', method: 'get'}},
            'site.get':            {title: loc._f('Get site(s)'),      type: 'global', ownerModule: name, menuItem: {parent:'session-menu', action: 'object', service: 'site'}},
        },
    },
};
