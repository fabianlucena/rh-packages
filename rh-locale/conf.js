'use strict';

import {l} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhLocale';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name: name,
    title: 'Locale',
    version: '0.1',
    schema: 'locale',
    init: [],
    configure: null,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        languages: {
            'en':    {title: l._f('English')},
        },
    },
};
