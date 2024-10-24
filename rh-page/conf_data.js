import { loc } from 'rf-locale';

const name = 'rhPage';

export const data = {
  pageFormats: [
    { name: 'plain', title: loc._cf('pageFormat', 'Plain'),  isTranslatable: true, ownerModule: name },
    { name: 'html',  title: loc._cf('pageFormat', 'Format'), isTranslatable: true, ownerModule: name },
  ],
    
  resourceTypes: [
    { name: 'image/png',     title: loc._cf('resourceType', 'PNG image'), isTranslatable: true, ownerModule: name },
    { name: 'image/svg+xml', title: loc._cf('resourceType', 'SVG image'), isTranslatable: true, ownerModule: name },
  ],

  roles: [
    { name: 'resourceManager', title: loc._cf('role', 'Resource manager'), isTranslatable: true, ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'resourceManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'resource.get',    title: loc._cf('permission', 'Get resources'),    isTranslatable: true, roles: 'resourceManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'Resources'), isTranslatable: true, icon: 'resource', action: 'grid', service: 'resource' }},
    { name: 'resource.create', title: loc._cf('permission', 'Create resources'), isTranslatable: true, roles: 'resourceManager', ownerModule: name, },
  ]
};
