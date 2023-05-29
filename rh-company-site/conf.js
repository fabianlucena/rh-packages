'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhCompany';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Company Site',
    version: '0.1',
    schema: 'company',
    modelsPath: dirname + '/models',
    routesPath: dirname + '/routes',
    servicesPath: dirname + '/services',

    data: {
        permissions: [
            {name: 'company-site.switch', title: loc._f('Switch company'), isTranslatable: true, ownerModule: name, menuItem: {isTranslatable: true, action: 'object', service: 'company-site'}},
        ],
    },
};
