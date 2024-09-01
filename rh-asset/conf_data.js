import { loc } from 'rf-locale';

const name = 'rhAsset';

export const data = {
  roles: [
    { name: 'assetManager', title: loc._cf('asset', 'Assets manager'), isTranslatable: true, translationContext: 'asset', ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'assetManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'assetType.get',    title: loc._cf('asset', 'Get assets types'),    isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, menuItem: { label: loc._cf('asset', 'Assets types'), isTranslatable: true, translationContext: 'asset', parent: 'administration', icon: 'asset-type', action: 'grid', service: 'asset-type' }},
    { name: 'assetType.create', title: loc._cf('asset', 'Create assets types'), isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },
    { name: 'assetType.edit',   title: loc._cf('asset', 'Edit assets types'),   isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },
    { name: 'assetType.delete', title: loc._cf('asset', 'Delete assets types'), isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },

    { name: 'asset.get',        title: loc._cf('asset', 'Get assets'),          isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, menuItem: { label: loc._cf('asset', 'Assets'),       isTranslatable: true, translationContext: 'asset', parent: 'administration', icon: 'asset',      action: 'grid', service: 'asset' }},
    { name: 'asset.create',     title: loc._cf('asset', 'Create assets'),       isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },
    { name: 'asset.edit',       title: loc._cf('asset', 'Edit assets'),         isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },
    { name: 'asset.delete',     title: loc._cf('asset', 'Delete assets'),       isTranslatable: true, translationContext: 'asset', roles: 'assetManager', ownerModule: name, },
  ],
};
