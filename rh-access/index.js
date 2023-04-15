import {SiteService} from './services/site.js';
import {RoleService} from './services/role.js';
import {PermissionService} from './services/permission.js';
import {RolePermissionService} from './services/role_permission.js';
import {UserRoleSiteService} from './services/user_role_site.js';
import {PrivilegesController} from './controllers/privileges.js';
import {NoPermissionError} from 'http-util';
import {locale as l} from 'rofa-util';
import url from 'url';
import path from 'path';

const name = 'rhAccess';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name: name,
    title: 'Access',
    version: '0.1',
    schema: 'acc',
    init: [],
    configure,
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync,
    data: {
        permissions: {
            'current-site.switch': {title: l._f('Switch site'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
            'current-site.get':    {title: l._f('Get current site'), type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'get'}},
            'site.get':            {title: l._f('Get site(s)'),      type: 'private', roles: 'user', module: name, menuItem: {service: 'site',  action: 'form'}},
        },

        userRoleSites: {
            'user:admin,role:admin,site:system': {username: 'admin', role: 'admin', site: 'system'},
        },
    },
};

async function checkPermission(req, ...requiredPermissions) {
    if (requiredPermissions.includes('login') || requiredPermissions.includes('logout'))
        return true;

    if (req) {
        if (req.roles?.includes('admin'))
            return true;

        const permissions = req.permissions;
        if (permissions) {
            for (let i = 0, e = requiredPermissions.length; i < e; i++)
                if (permissions.includes(requiredPermissions[i]))
                    return true;
        }
    }

    return false;
}

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (await checkPermission(req, ...requiredPermissions))
            return;

        if (chain && await chain(req, ...requiredPermissions))
            return;

        throw new NoPermissionError({permissions: requiredPermissions});
    };
}

async function afterConfigAsync(_, global) {
    for (const siteName in global?.data?.sites) {
        const data = global.data.sites[siteName];
        data.name = siteName;
        await SiteService.createIfNotExists(data);
    }

    for (const roleName in global?.data?.roles) {
        const data = global.data.roles[roleName];
        data.name = roleName;
        await RoleService.createIfNotExists(data);
    }

    for (const permissionName in global?.data?.permissions) {
        const data = global.data.permissions[permissionName];

        await PermissionService.createIfNotExists({...data, name: permissionName});

        if (data.roles) {
            const roles = data.roles instanceof Array?
                data.roles:
                data.roles.split(',');

            await Promise.all(roles.map(async roleName => await RolePermissionService.createIfNotExists({role: roleName, permission: permissionName})));
        }
    }

    for (const userRoleSiteName in global?.data?.userRoleSites) {
        const userRoleSite = global.data.userRoleSites[userRoleSiteName];
        await UserRoleSiteService.createIfNotExists(userRoleSite);
    }
}

function configure(global) {
    if (global.router)
        global.router.use(PrivilegesController.middleware());

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);
}
