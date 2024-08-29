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
    { name: 'workflow.admin',          parent: 'administration', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Workflow'),              isTranslatable: true, translationContext: 'workflow', icon: 'workflow' },
    { name: 'workflow.get',            parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Workflows'),             isTranslatable: true, translationContext: 'workflow', icon: 'workflow',            action: 'grid', service: 'workflow' },
    { name: 'workflow-of-entity.get',  parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Workflows of entities'), isTranslatable: true, translationContext: 'workflow', icon: 'workflow-of-entity',  action: 'grid', service: 'workflow-of-entity' },
    { name: 'workflow-status.get',     parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Statuses'),              isTranslatable: true, translationContext: 'workflow', icon: 'workflow-status',     action: 'grid', service: 'workflow-status' },
    { name: 'workflow-transition.get', parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Transitions'),           isTranslatable: true, translationContext: 'workflow', icon: 'workflow-transition', action: 'grid', service: 'workflow-transition' },

    { name: 'workflow-case.get',       parent: 'workflow.admin', ownerModule: name, permissions: 'workflow.get', label: loc._cf('workflow', 'Cases'),                 isTranslatable: true, translationContext: 'workflow', icon: 'workflow-case',       action: 'grid', service: 'workflow-case' },
  ],
};
