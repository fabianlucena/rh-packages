import {loc} from 'rf-locale';

const name = 'rhBranch';

export const data = {
    roles: [
        {name: 'branchManager', title: loc._cf('role', 'Branch manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'branchManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'branch.get',    title: loc._cf('permission', 'Get branches'),    isTranslatable: true, roles: 'branchManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Branches'), isTranslatable: true, parent: 'administration', action: 'grid', service: 'branch'}},
        {name: 'branch.create', title: loc._cf('permission', 'Create branches'), isTranslatable: true, roles: 'branchManager', ownerModule: name,},
        {name: 'branch.edit',   title: loc._cf('permission', 'Edit branches'),   isTranslatable: true, roles: 'branchManager', ownerModule: name,},
        {name: 'branch.delete', title: loc._cf('permission', 'Delete branches'), isTranslatable: true, roles: 'branchManager', ownerModule: name,},
    ],
};
