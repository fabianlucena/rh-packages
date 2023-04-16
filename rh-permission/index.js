import {PermissionService} from './services/permission.js';
import {NoPermissionError} from 'http-util';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = function(global) {
    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);
};

conf.afterConfig = async function(_, global) {
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

    for (const userRoleSiteName in global?.data?.userRoleSite) {
        const userRoleSite = global.data.userRoleSite[userRoleSiteName];
        await UserRoleSiteService.createIfNotExists(userRoleSite);
    }
};

async function checkPermissionForUsernameAndSiteName(privileges, ...requiredPermissions) {
    if (requiredPermissions.includes('login') || requiredPermissions.includes('logout'))
        return true;

    if (privileges?.roles.includes('admin'))
        return true;

    if (privileges) {
        const permissions = privileges?.permissions;
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
        if (await checkPermissionForUsernameAndSiteName(req, ...requiredPermissions))
            return;

        if (chain && await chain(req, ...requiredPermissions))
            return;

        throw new NoPermissionError({permissions: requiredPermissions});
    };
}
