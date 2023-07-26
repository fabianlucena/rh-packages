'use strict';

import url from 'url';
import path from 'path';

const name = 'rhProjectTag';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Project Tag',
    version: '0.1',
    path: dirname,
    schema: 'project',
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    tagCategory: 'project',
};
