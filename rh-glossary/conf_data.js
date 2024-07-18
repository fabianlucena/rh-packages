import { loc } from 'rf-locale';

const name = 'rhGlossary';

export const data = {
  roles: [
    { name: 'glossaryManager', title: loc._cf('role', 'Glossary manager'), isTranslatable: true, ownerModule: name },
    { name: 'glossaryEditor',  title: loc._cf('role', 'Glossary editor'),  isTranslatable: true, ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'glossaryManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'glossary.get',    title: loc._cf('permission', 'Get glossarys'),    isTranslatable: true, roles: 'glossaryManager', ownerModule: name },
    { name: 'glossary.create', title: loc._cf('permission', 'Create glossarys'), isTranslatable: true, roles: 'glossaryManager', ownerModule: name },
    { name: 'glossary.edit',   title: loc._cf('permission', 'Edit glossarys'),   isTranslatable: true, roles: [ 'glossaryManager', 'glossaryEditor' ], ownerModule: name },
    { name: 'glossary.delete', title: loc._cf('permission', 'Delete glossarys'), isTranslatable: true, roles: 'glossaryManager', ownerModule: name },
  ],

  menuItems: [
    { name: 'glossary.admin',    parent: 'administration', ownerModule: name, permissions: 'glossary.edit', label: loc._cf('menu', 'Glossary'),   isTranslatable: true, translationContext: 'menu', icon: 'glossary' },
    { name: 'glossary.get',      parent: 'glossary.admin', ownerModule: name, permissions: 'glossary.get',  label: loc._cf('menu', 'Glossaries'), isTranslatable: true, translationContext: 'menu', icon: 'glossary',   action: 'grid', service: 'glossary' },
    { name: 'glossary.category', parent: 'glossary.admin', ownerModule: name, permissions: 'glossary.edit', label: loc._cf('menu', 'Categories'), isTranslatable: true, translationContext: 'menu', icon: 'categories', action: 'grid', service: 'glossary-category' },
    { name: 'glossary.type',     parent: 'glossary.admin', ownerModule: name, permissions: 'glossary.edit', label: loc._cf('menu', 'Type'),       isTranslatable: true, translationContext: 'menu', icon: 'type',       action: 'grid', service: 'glossary-type' },
  ],
};
