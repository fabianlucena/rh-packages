import { MenuItemService } from './services/menu_item.js';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.updateData = async function(global) {
  const menuItemService = MenuItemService.singleton();
  const perspectiveMenuItemDeleteFor = (() => {
    const service = dependency.get('perspectiveMenuItemService');
    if (service) {
      return async where => service.deleteFor(where);
    } else {
      return async () => {};
    }
  })();

  const noncustom = await menuItemService.getFor({ custom: false });

  await runSequentially(global?.data?.menuItems, async menuItem => await mergeMenuItem(menuItemService, noncustom, menuItem));

  await runSequentially(global?.data?.permissions, async permissionData => {
    let menuItemData = permissionData.menuItem;
    if (!menuItemData) {
      return;
    }

    if (menuItemData === true) {
      menuItemData = {};
    }

    menuItemData.data ??= {};
    menuItemData.name ??= menuItemData.data.name ?? permissionData.name;
    menuItemData.uuid ??= menuItemData.data.uuid;
    menuItemData.isEnabled ??= menuItemData.data.isEnabled;
    menuItemData.parent ??= menuItemData.data.parent;
    menuItemData.permission ??= permissionData.name;
    menuItemData.isTranslatable ??= permissionData.isTranslatable;
    menuItemData.translationContext ??= permissionData.translationContext;
    menuItemData.ownerModule ??= permissionData.ownerModule;
    menuItemData.data.label ??= menuItemData.label;

    if (!menuItemData.data.label) {
      const label = permissionData.label ?? permissionData.title;
      if (label) {
        menuItemData.data.label = label;
        menuItemData.isTranslatable ??= permissionData.isTranslatable;
      }
    }
         
    let { uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, translationContext, ownerModule, ownerModuleId, ...resData } = {
      ...menuItemData, 
      ...menuItemData.data, 
    };

    menuItemData = { uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, translationContext, ownerModule, ownerModuleId, data: resData };

    await mergeMenuItem(menuItemService, noncustom, menuItemData);
  });

  await runSequentially(global?.data?.menuItemsOverride, async menuItem => await menuItemService.override(menuItem));

  const menuItems = global?.data?.menuItems ?? [];
  const permissions = global?.data?.permissions ?? [];
  for (const nonCustomItem of noncustom) {
    if (nonCustomItem.name === 'asset-family.get') {
      console.log();
    }
    if (!menuItems.find(item => item.name === nonCustomItem.name)) {
      const perms = permissions.find(item => (item.menuItem?.name ?? item.name) == nonCustomItem.name);
      if (!perms?.menuItem) {
        await perspectiveMenuItemDeleteFor({ menuItemId: nonCustomItem.id });
        await menuItemService.deleteForId(nonCustomItem.id);
      }
    }
  }

  await runSequentially(global?.data?.menuItemsDelete, async menuItemName => {
    await perspectiveMenuItemDeleteFor({ menuItem: { name: menuItemName }});
    await menuItemService.deleteForName(menuItemName);
  });
};

async function mergeMenuItem(service, existingNonCustom, menuItem) {
  const existing = existingNonCustom.find(item => item.name === menuItem.name);
  if (existing && !existing.custom) {
    const i = { ...menuItem };
    delete i.name;
    await service.updateForId(i, existing.id);
  } else if (!existing) {
    await service.createIfNotExists(menuItem);
  }
}