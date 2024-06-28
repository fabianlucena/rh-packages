import { MenuItemService } from './services/menu_item.js';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';

export const conf = localConf;

conf.updateData = async function(global) {
  const menuItemService = MenuItemService.singleton();
  await runSequentially(global?.data?.menuItems, async menuItem => await menuItemService.createIfNotExists(menuItem));

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
    menuItemData.data.label ??= menuItemData.label;

    if (!menuItemData.data.label) {
      const label = permissionData.label ?? permissionData.title;
      if (label) {
        menuItemData.data.label = label;
        menuItemData.isTranslatable ??= permissionData.isTranslatable;
      }
    }
         
    // eslint-disable-next-line no-unused-vars
    let { uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, data, ...resData } = {
      ...menuItemData, 
      ...menuItemData.data, 
    };

    menuItemData.data = resData;

    await menuItemService.createIfNotExists(menuItemData);
  });

  await runSequentially(global?.data?.menuItemsOverride, async menuItem => await menuItemService.override(menuItem));
};
