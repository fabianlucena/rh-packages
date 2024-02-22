import {loc} from 'rf-util';

const name = 'rhProject';

export const data = {
    roles: [
        {name: 'projectManager', title: loc._cf('role', 'Project manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'projectManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'project.get',    title: loc._cf('permission', 'Get projects'),    isTranslatable: true, roles: 'projectManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Projects'), isTranslatable: true, icon: 'project', parent: 'administration', action: 'grid', service: 'project'}},
        {name: 'project.create', title: loc._cf('permission', 'Create projects'), isTranslatable: true, roles: 'projectManager', ownerModule: name,},
        {name: 'project.edit',   title: loc._cf('permission', 'Edit projects'),   isTranslatable: true, roles: 'projectManager', ownerModule: name,},
        {name: 'project.delete', title: loc._cf('permission', 'Delete projects'), isTranslatable: true, roles: 'projectManager', ownerModule: name,},
    ],
};
