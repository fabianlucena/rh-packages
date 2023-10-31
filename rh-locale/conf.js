import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhLocale';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Locale',
    version: '0.1',
    schema: 'locale',
    configure: null,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
        languages: [
            {
                name: 'en',
                title: loc._f('English'),
            },
        ],
    },
};
