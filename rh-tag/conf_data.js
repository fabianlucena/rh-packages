'use strict';

import {loc} from 'rf-locale';

const name = 'rhTag';

export const data = {
    roles: [
        {name: 'tagsManager', title: loc._cf('role', 'Tag manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'tagsManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'tag.get',    title: loc._cf('permission', 'Get tags'),    isTranslatable: true, roles: 'tagsManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Tags'), isTranslatable: true, parent: 'administration', action: 'grid', service: 'tag'}},
        {name: 'tag.create', title: loc._cf('permission', 'Create tags'), isTranslatable: true, roles: 'tagsManager', ownerModule: name,},
        {name: 'tag.edit',   title: loc._cf('permission', 'Edit tags'),   isTranslatable: true, roles: 'tagsManager', ownerModule: name,},
        {name: 'tag.delete', title: loc._cf('permission', 'Delete tags'), isTranslatable: true, roles: 'tagsManager', ownerModule: name,},
    ],
};
