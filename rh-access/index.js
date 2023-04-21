import {RoleService} from './services/role.js';
import {PermissionService} from './services/permission.js';
import {RolePermissionService} from './services/role_permission.js';
import {UserRoleSiteService} from './services/user_role_site.js';
import {PrivilegesController} from './controllers/privileges.js';
import {NoPermissionError} from 'http-util';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.afterConfigAsync = afterConfigAsync;

function configure(global) {
    if (global.router)
        global.router.use(PrivilegesController.middleware());

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);
}

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (await checkPermissionForUsernameAndSiteName(req, ...requiredPermissions))
            return;

        if (await chain(req, ...requiredPermissions))
            return;

        throw new NoPermissionError({permissions: requiredPermissions});
    };

}

async function checkPermissionForUsernameAndSiteName(privileges, ...requiredPermissions) {
    if (!privileges)
        return false;

    if (privileges.roles?.includes('admin'))
        return true;

    const permissions = privileges.permissions;
    if (!permissions)
        return false;
        
    for (let i = 0, e = requiredPermissions.length; i < e; i++)
        if (permissions.includes(requiredPermissions[i]))
            return true;

    return false;
}

async function afterConfigAsync(_, global) {
    for (const roleName in global?.data?.roles) {
        const data = global.data.roles[roleName];
        await RoleService.createIfNotExists({...data, name: roleName});
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
