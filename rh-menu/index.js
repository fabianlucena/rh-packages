import {MenuItemService} from './services/menu_item.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.afterConfig = async function(_, global) {
    await runSequentially(global?.data?.permissions, async permissionData => {
        let menuItemData = permissionData.menuItem;
        if (!menuItemData)
            return;

        if (menuItemData === true)
            menuItemData = {};

        if (!menuItemData.data)
            menuItemData.data = {};

        menuItemData.name ??= menuItemData.data.name ?? permissionData.name;
        menuItemData.uuid ??= menuItemData.data.uuid;
        menuItemData.isEnabled ??= menuItemData.data.isEnabled;
        menuItemData.name ??= menuItemData.data.name;
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
        let {uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, data, ...resData} = {
            ...menuItemData, 
            ...menuItemData.data, 
        };

        menuItemData.data = resData;

        await MenuItemService.createIfNotExists(menuItemData);
    });
};
