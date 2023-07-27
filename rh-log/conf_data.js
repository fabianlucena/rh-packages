'use strict';

import {loc} from 'rf-locale';

const name = 'rhLog';

export const data = {
    permissions: [
        {name: 'log.get', title: loc._cf('permission', 'Get log'), isTranslatable: true, roles: 'admin', ownerModule: name, menuItem: {label: loc._cf('menu', 'Log'), parent: 'administration', action: 'grid', service: 'log'}},
    ],
};
