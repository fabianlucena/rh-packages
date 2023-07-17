'use strict';

import {loc} from 'rf-locale';

const name = 'rhMainCompany';

export const data = {
    roles: [
        {name: 'mainCompanyManager',  title: loc._cf('role', 'Main companies manager'),    isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'mainCompanyManager', site: 'system', ownerModule: name},
    ],

    permissions: [        
        {name: 'main-company.get',    title: loc._cf('permission', 'Get main companies'),    isTranslatable: true, roles: 'mainCompanyManager',  ownerModule: name, menuItem: {label: loc._cf('mainCompany', 'Main companies'), isTranslatable: true, parent: 'administration', translationContext: 'mainCompany', action: 'grid', service: 'main-company'}},
        {name: 'main-company.create', title: loc._cf('permission', 'Create main companies'), isTranslatable: true, roles: 'mainCompanyManager',  ownerModule: name},
        {name: 'main-company.edit',   title: loc._cf('permission', 'Edit main companies'),   isTranslatable: true, roles: 'mainCompanyManager',  ownerModule: name},
        {name: 'main-company.delete', title: loc._cf('permission', 'Delete main companies'), isTranslatable: true, roles: 'mainCompanyManager',  ownerModule: name},
    ],
};
