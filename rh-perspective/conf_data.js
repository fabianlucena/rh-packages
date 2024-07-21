import { loc } from 'rf-locale';

const name = 'rhPerspective';

export const data = {
  roles: [
    { name: 'perspective.manager',  title: loc._cf('permission', 'Perspective manager'),  isTranslatable: true, translationContext: 'perspective', ownerModule: name },
    { name: 'perspective.selector', title: loc._cf('permission', 'Perspective selector'), isTranslatable: true, translationContext: 'perspective', ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'perspective.manager',  site: 'system', ownerModule: name },
    { role: 'admin', parent: 'perspective.selector', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'perspective.get',    title: loc._cf('permission', 'Get perspectives'),    isTranslatable: true, translationContext: 'perspective', roles: 'perspective.manager',  ownerModule: name },
    { name: 'perspective.create', title: loc._cf('permission', 'Create perspectives'), isTranslatable: true, translationContext: 'perspective', roles: 'perspective.manager',  ownerModule: name },
    { name: 'perspective.edit',   title: loc._cf('permission', 'Edit perspectives'),   isTranslatable: true, translationContext: 'perspective', roles: 'perspective.manager',  ownerModule: name },
    { name: 'perspective.delete', title: loc._cf('permission', 'Delete perspectives'), isTranslatable: true, translationContext: 'perspective', roles: 'perspective.manager',  ownerModule: name },
    { name: 'perspective.select', title: loc._cf('permission', 'Select perspectives'), isTranslatable: true, translationContext: 'perspective', roles: 'perspective.selector', ownerModule: name },
  ],

  menuItems: [
    { name: 'perspective.admin', parent: 'administration',    ownerModule: name, permissions: 'perspective.edit',   label: loc._cf('perspective', 'Perspective'),             isTranslatable: true, translationContext: 'perspective', icon: 'perspective' },
    { name: 'perspective.get',   parent: 'perspective.admin', ownerModule: name, permissions: 'perspective.get',    label: loc._cf('perspective', 'Perspectives'),            isTranslatable: true, translationContext: 'perspective', icon: 'perspective',           action: 'grid', service: 'perspective' },
    { name: 'perspective.edit',  parent: 'perspective.admin', ownerModule: name, permissions: 'perspective.get',    label: loc._cf('perspective', 'Perspectives menu items'), isTranslatable: true, translationContext: 'perspective', icon: 'perspective-menu-item', action: 'grid', service: 'perspective-menu-item' },
    { name: 'perspective.menu',                               ownerModule: name, permissions: 'perspective.select', label: loc._cf('perspective', 'Perspectives'),            isTranslatable: true, translationContext: 'perspective', icon: 'perspective' },
  ],
};
