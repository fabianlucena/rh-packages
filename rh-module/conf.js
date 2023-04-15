import url from 'url';
import path from 'path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name: 'rhModule',
    title: 'Modules',
    version: '0.1',
    schema: 'module',
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
};
