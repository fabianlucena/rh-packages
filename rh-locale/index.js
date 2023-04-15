import {middleware} from './controllers/locale.js';
import url from 'url';
import path from 'path';

const name = 'rhLocale';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name: name,
    title: 'Locale',
    version: '0.1',
    schema: 'locale',
    configure: configure,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
};

function configure(global) {
    if (global.router)
        global.router.use(middleware());
}
