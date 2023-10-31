import url from 'url';
import path from 'path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const name = 'rhAuth';

export const conf = {
    name,
    title: 'RH Authorization',
    version: '0.1',
    path: dirname,
    schema: 'auth',
    init: [],
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    controllersPath: dirname + '/controllers',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
};
