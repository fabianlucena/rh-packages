import {MenuItemService} from './services/menu_item.js';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.afterConfigAsync = async function(_, options) {
    for (const permissionName in options?.data?.permissions) {
        const permissionData = options.data.permissions[permissionName];
        const menuItemData = permissionData.menuItem;
        if (!menuItemData)
            continue;

        if (!menuItemData.data)
            menuItemData.data = {};

        menuItemData.uuid ??= menuItemData.data.uuid;
        menuItemData.isEnabled ??= menuItemData.data.isEnabled;
        menuItemData.name ??= menuItemData.data.name;
        menuItemData.parent ??= menuItemData.data.parent;

        if (!menuItemData.name)
            menuItemData.name = menuItemData.data.name ?? permissionName;

        if (!menuItemData.permissionId && !menuItemData.permission)
            menuItemData.permission = permissionName;
            
        menuItemData.data = {
            label: (permissionData.label ?? permissionData.title), 
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
    }
};
