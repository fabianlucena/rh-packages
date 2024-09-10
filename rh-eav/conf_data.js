import { loc } from 'rf-locale';

const name = 'rhEav';

export const data = {
  roles: [
    { name: 'eavManager', title: loc._cf('eav', 'EAV manager'), isTranslatable: true, translationContext: 'eav', ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'eavManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'eavAttributeType.get',    title: loc._cf('eav', 'Get attributes types'),    isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, menuItem: { label: loc._cf('eav', 'Attributes types'), isTranslatable: true, translationContext: 'eav', parent: 'administration', icon: 'attribute-type', action: 'grid', service: 'attribute-type' }},
    { name: 'eavAttributeType.edit',   title: loc._cf('eav', 'Edit attributes types'),   isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, },

    { name: 'eavAttribute.get',        title: loc._cf('eav', 'Get attributes'),          isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, menuItem: { label: loc._cf('eav', 'Attributes'),       isTranslatable: true, translationContext: 'eav', parent: 'administration', icon: 'attribute',      action: 'grid', service: 'attribute' }},
    { name: 'eavAttribute.create',     title: loc._cf('eav', 'Create attributes'),       isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, },
    { name: 'eavAttribute.edit',       title: loc._cf('eav', 'Edit attributes'),         isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, },
    { name: 'eavAttribute.delete',     title: loc._cf('eav', 'Delete attributes'),       isTranslatable: true, translationContext: 'eav', roles: 'eavManager', ownerModule: name, },
  ],
  
  eavAttributesTypes: [
    { name: 'text',   title: loc._cf('eav', 'Text'),   description: loc._cf('eav', 'The value is a free text.'),                       isTranslatable: true, translationContext: 'eav' },
    { name: 'number', title: loc._cf('eav', 'Number'), description: loc._cf('eav', 'The value is a number.'),                          isTranslatable: true, translationContext: 'eav' },
    { name: 'check',  title: loc._cf('eav', 'Check'),  description: loc._cf('eav', 'The value is a check.'),                           isTranslatable: true, translationContext: 'eav' },
    { name: 'select', title: loc._cf('eav', 'Select'), description: loc._cf('eav', 'The value must be select from a set of options.'), isTranslatable: true, translationContext: 'eav' },
    { name: 'tags'  , title: loc._cf('eav', 'Tags'),   description: loc._cf('eav', 'The values are tags, free to add and select.'),    isTranslatable: true, translationContext: 'eav' },
  ],
};
