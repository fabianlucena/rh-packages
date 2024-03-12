import {loc} from 'rf-locale';

const name = 'rhWorkflow';

export const data = {
    roles: [
        {name: 'workflowManager', title: loc._cf('role', 'Workflow manager'), isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'workflowManager', site: 'system', ownerModule: name},
    ],

    permissions: [
        {name: 'workflow.get',    title: loc._cf('permission', 'Get workflows'),    isTranslatable: true, roles: 'workflowManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Workflows'), isTranslatable: true, icon: 'workflow', action: 'grid', service: 'workflow'}},
        {name: 'workflow.create', title: loc._cf('permission', 'Create workflows'), isTranslatable: true, roles: 'workflowManager', ownerModule: name,},
        {name: 'workflow.edit',   title: loc._cf('permission', 'Edit workflows'),   isTranslatable: true, roles: 'workflowManager', ownerModule: name,},
        {name: 'workflow.delete', title: loc._cf('permission', 'Delete workflows'), isTranslatable: true, roles: 'workflowManager', ownerModule: name,},
    ],
};
