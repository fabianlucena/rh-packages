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
    { name: 'glossary.get',    title: loc._cf('permission', 'Get glossarys'),    isTranslatable: true, roles: 'glossaryManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'Glossarys'), isTranslatable: true, icon: 'glossary', action: 'grid', service: 'glossary' }},
    { name: 'glossary.create', title: loc._cf('permission', 'Create glossarys'), isTranslatable: true, roles: 'glossaryManager', ownerModule: name, },
    { name: 'glossary.edit',   title: loc._cf('permission', 'Edit glossarys'),   isTranslatable: true, roles: 'glossaryManager', ownerModule: name, },
    { name: 'glossary.delete', title: loc._cf('permission', 'Delete glossarys'), isTranslatable: true, roles: [ 'glossaryManager', 'glossaryEditor' ], ownerModule: name, },
  ],
};
