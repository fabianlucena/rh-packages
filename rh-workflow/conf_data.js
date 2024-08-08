import { loc } from 'rf-locale';

const name = 'rhWorkflow';

export const data = {
  roles: [
    { name: 'workflowManager', title: loc._cf('workflow', 'Workflow manager'), isTranslatable: true, translationContext: 'workflow', ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'workflowManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'workflow.get',    title: loc._cf('workflow', 'Get workflows'),    isTranslatable: true, translationContext: 'workflow', roles: 'workflowManager', ownerModule: name },
    { name: 'workflow.create', title: loc._cf('workflow', 'Create workflows'), isTranslatable: true, translationContext: 'workflow', roles: 'workflowManager', ownerModule: name },
    { name: 'workflow.edit',   title: loc._cf('workflow', 'Edit workflows'),   isTranslatable: true, translationContext: 'workflow', roles: 'workflowManager', ownerModule: name },
    { name: 'workflow.delete', title: loc._cf('workflow', 'Delete workflows'), isTranslatable: true, translationContext: 'workflow', roles: 'workflowManager', ownerModule: name },
  ],
  
  menuItems: [
    { name: 'workflow.admin', parent: 'administration', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Workflow'),  isTranslatable: true, translationContext: 'workflow', icon: 'perspective' },
    { name: 'workflow.get',   parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Workflows'), isTranslatable: true, translationContext: 'workflow', icon: 'workflow',   action: 'grid', service: 'workflow' }
  ],
};
