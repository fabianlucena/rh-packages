'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhSite';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Sites',
    version: '0.1',
    schema: 'syst',
    init: null,
    configure: null,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        sites: [
            {name: 'system', title: loc._f('System'), isTranslatable: true, ownerModule: name},
        ],

        roles: [
            {name: 'sitesManager', title: loc._f('Sites manager'), isTranslatable: true, ownerModule: name},
        ],

        permissions: [
            {name: 'site.get',            title: loc._f('Get sites'),        isTranslatable: true, roles: 'sitesManager', ownerModule: name, menuItem: {action: 'grid', service: 'site'}},
        ],
    },
};
