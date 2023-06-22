'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhProjectSelect';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Select Project',
    version: '0.1',
    schema: 'company',
    routesPath: dirname + '/routes',
    servicesPath: dirname + '/services',

    data: {
        permissions: [
            {name: 'project-select.switch', title: loc._cf('permission', 'Select project'), isTranslatable: true, ownerModule: name, menuItem: {title: loc._cf('menu', 'Select project'), isTranslatable: true, action: 'object', service: 'project-select'}},
        ],
    },
};
