const name = 'rhMenu';

const conf = {
    name: name,
    title: 'Menu',
    version: '0.1',
    schema: 'menu',
    routesPath: __dirname + '/routes',
    modelsPath: __dirname + '/models',
    servicesPath: __dirname + '/services',
    apis: [__dirname + '/routes/*.js', __dirname + '/controllers/*.js'],
    afterConfig: afterConfig,
};

async function afterConfig(_, options) {
    const MenuItemService = require('./services/menu_item');
    
    for (const permissionName in options?.data?.permissions) {
        const data = options.data.permissions[permissionName];
        const menuData = data.menuItem;
        if (!menuData)
            continue;

        if (!menuData.name)
            menuData.name = permissionName;
        
        if (!menuData.title)
            menuData.title = data.title;
    
        if (!menuData.permissionId && !menuData.permission)
            menuData.permission = permissionName;

        await MenuItemService.createIfNotExists(menuData);
    };
}

module.exports = conf;