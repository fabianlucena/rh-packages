import {MenuItemService} from './services/menu_item.js';
import {conf as localConf} from './conf.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.afterConfigAsync = async function(_, global) {
    await runSequentially(global?.data?.permissions, async permission => {
        const menuItemData = permission.menuItem;
        if (!menuItemData)
            return;

        if (!menuItemData.data)
            menuItemData.data = {};

        menuItemData.name ??= menuItemData.data.name ?? permission.name;
        menuItemData.uuid ??= menuItemData.data.uuid;
        menuItemData.isEnabled ??= menuItemData.data.isEnabled;
        menuItemData.name ??= menuItemData.data.name;
        menuItemData.parent ??= menuItemData.data.parent;
        menuItemData.permission ??= permission.name;
            
        menuItemData.data = {
            label: (permission.label ?? permission.title), 
            ...menuItemData, 
            data: undefined, 
            ...menuItemData.data, 
            uuid: undefined, 
            isEnabled: undefined, 
            name: undefined, 
            parent: undefined, 
            parentId: undefined, 
            permission: undefined, 
            permissionId: undefined
        };

        await MenuItemService.createIfNotExists(menuItemData);
    });
};
