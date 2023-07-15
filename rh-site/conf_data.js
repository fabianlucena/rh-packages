'use strict';

import {loc} from 'rf-locale';

const name = 'rhSite';

export const data = {
    sites: [
        {name: 'system', title: loc._cf('site', 'System'), isTranslatable: true, ownerModule: name},
    ],

    roles: [
        {name: 'sitesManager', title: loc._cf('role', 'Sites manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'sitesManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'site.get', title: loc._cf('permission', 'Get sites'), isTranslatable: true, roles: 'sitesManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Sites'), parent: 'administration', action: 'grid', service: 'site', toolbarIcon: 'site'}},
    ],
};
