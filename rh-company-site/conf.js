'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhCompanySite';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Company site',
    version: '0.1',
    schema: 'company',
    modelsPath: dirname + '/models',
    routesPath: dirname + '/routes',
    servicesPath: dirname + '/services',

    data: {
        permissions: [
            {name: 'company-site.switch', title: loc._cf('permission', 'Select company'), isTranslatable: true, ownerModule: name, menuItem: {label: loc._cf('menu', 'Select company'), isTranslatable: true, action: 'object', service: 'company-site'}},
        ],
    },
};
