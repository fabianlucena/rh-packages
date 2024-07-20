import { loc } from 'rf-locale';

const name = 'rhPerspective';

export const data = {
  roles: [
    { name: 'perspectiveManager',  title: loc._cf('role', 'Perspective manager'),  isTranslatable: true, translationContext: 'perspective', ownerModule: name },
    { name: 'perspectiveSelector', title: loc._cf('role', 'Perspective selector'), isTranslatable: true, translationContext: 'perspective', ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'perspectiveManager',  site: 'system', ownerModule: name },
    { role: 'admin', parent: 'perspectiveSelector', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'perspective.get',    title: loc._cf('permission', 'Get perspectives'),    isTranslatable: true, translationContext: 'perspective', roles: 'perspectiveManager', ownerModule: name },
    { name: 'perspective.create', title: loc._cf('permission', 'Create perspectives'), isTranslatable: true, translationContext: 'perspective', roles: 'perspectiveManager', ownerModule: name },
    { name: 'perspective.edit',   title: loc._cf('permission', 'Edit perspectives'),   isTranslatable: true, translationContext: 'perspective', roles: 'perspectiveManager', ownerModule: name },
    { name: 'perspective.delete', title: loc._cf('permission', 'Delete perspectives'), isTranslatable: true, translationContext: 'perspective', roles: 'perspectiveManager', ownerModule: name },
  ],

  menuItems: [
    { name: 'perspective.admin',   parent: 'administration',    ownerModule: name, permissions: 'perspective.edit', label: loc._cf('perspective', 'Perspective'),             isTranslatable: true, translationContext: 'perspective', icon: 'perspective' },
    { name: 'perspective.get',     parent: 'perspective.admin', ownerModule: name, permissions: 'perspective.get',  label: loc._cf('perspective', 'Perspectives'),            isTranslatable: true, translationContext: 'perspective', icon: 'perspective',           action: 'grid', service: 'perspective' },
    { name: 'perspective.edit',    parent: 'perspective.admin', ownerModule: name, permissions: 'perspective.get',  label: loc._cf('perspective', 'Perspectives menu items'), isTranslatable: true, translationContext: 'perspective', icon: 'perspective-menu-item', action: 'grid', service: 'perspective-menu-item' },
  ],
};
