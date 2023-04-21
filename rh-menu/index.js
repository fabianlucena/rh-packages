import {MenuItemService} from './services/menu_item.js';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.afterConfigAsync = async function(_, options) {
    for (const permissionName in options?.data?.permissions) {
        const data = options.data.permissions[permissionName];
        const menuData = data.menuItem;
        if (!menuData)
            continue;

        if (!menuData.name)
            menuData.name = permissionName;
        
        if (!menuData.label)
            menuData.label = data.label;
    
        if (!menuData.permissionId && !menuData.permission)
            menuData.permission = permissionName;

        await MenuItemService.createIfNotExists(menuData);
    }
};
