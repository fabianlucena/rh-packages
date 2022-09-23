const ru = require('rofa-util');
const l = ru.locale;

const name = 'rhAccess';

const conf = {
    name: name,
    title: 'Access',
    version: '0.1',
    schema: 'acc',
    init: [],
    configure: configure,
    routesPath: __dirname + '/routes',
    modelsPath: __dirname + '/models',
    servicesPath: __dirname + '/services',
    apis: [__dirname + '/routes/*.js', __dirname + '/controllers/*.js'],
    afterConfig: afterConfig,
    data: {
        permissions: {
            'current-site.switch': {title: l._f('Switch site'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
            'current-site.get':    {title: l._f('Get current site'), type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'get'}},
            'site.get':            {title: l._f('Get site(s)'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
        },

        userRoleSite: {
            'user:admin,role:admin,site:system': {username: 'admin', role: 'admin', site: 'system'},
        },
    },
};

async function checkPermissionForUsernameAndSiteName(username, siteName, ...requiredPermissions) {
    const RoleService = require('./services/role');
    const PermissionService = require('./services/permission');

    if (requiredPermissions.includes('login') || requiredPermissions.includes('logout'))
        return true;

    let hasPermission;
    if (siteName != 'system') {
        try {
            const roles = await RoleService.getNameForUsernameAndSiteName(username, 'system');
            hasPermission = roles.includes('admin');
            if (hasPermission)
                return true;
        } catch(error) {
            ru.errorHandler(error);
        }
    }

    if (siteName) {
        try {
            const roles = await RoleService.getNameForUsernameAndSiteName(username, siteName);
            hasPermission = roles.includes('admin');
            if (hasPermission)
                return true;
        } catch(error) {
            await ru.errorHandler(error);
        }

        try {
            const permissions = await PermissionService.getNameForUsernameAndSiteName(username, siteName)
            for (let i = 0, e = requiredPermissions.length; i < e; i++)
                if (permissions.includes(requiredPermissions[i]))
                    return true;
        } catch(error) {
            ru.errorHandler(error);
        }
    }

    return false;
}

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (await checkPermissionForUsernameAndSiteName(req?.user?.username, req?.site?.name, ...requiredPermissions))
            return;

        if (chain && await chain(req, ...requiredPermissions))
            return;

        const httpUtil = require('http-util');
        throw new httpUtil.NoPermissionError({permissions: requiredPermissions});
    }
}

async function afterConfig(_, global) {
    const RoleService = require('./services/role');
    const PermissionService = require('./services/permission');

    for (const roleName in global?.data?.roles) {
        const data = global.data.roles[roleName];
        data.name = roleName;
        await RoleService.createIfNotExists(data);
    }

    for (const permissionName in global?.data?.permissions) {
        const data = global.data.permissions[permissionName];

        await PermissionService.createIfNotExists(ru.merge(data, {name: permissionName}));

        if (data.roles) {
            const roles = data.roles instanceof Array?
                data.roles:
                data.roles.split(',');

            const RolePermissionService = require('./services/role_permission');
            await Promise.all(roles.map(async roleName => await RolePermissionService.createIfNotExists({role: roleName, permission: permissionName})));
        }
    };

    const UserRoleSiteService = require('./services/user_role_site');
    for (const userRoleSiteName in global?.data?.userRoleSite) {
        const userRoleSite = global.data.userRoleSite[userRoleSiteName];
        await UserRoleSiteService.createIfNotExists(userRoleSite);
    };
}

function configure(global) {
    require('./services/site');

    if (global.router) {
        const SiteController = require('./controllers/site');
        global.router.use(SiteController.middleware());
    }

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);
}

module.exports = conf;