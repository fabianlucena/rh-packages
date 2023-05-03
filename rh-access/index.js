import {RoleService} from './services/role.js';
import {RoleParentSiteService} from './services/role_parent_site.js';
import {PermissionService} from './services/permission.js';
import {UserRoleSiteService} from './services/user_role_site.js';
import {UserGroupService} from './services/user_group.js';
import {PrivilegesController} from './controllers/privileges.js';
import {NoPermissionError} from 'http-util';
import {runSequentially} from 'rf-util';
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
    const data = global?.data;
    await runSequentially(data?.roles,            async data => await RoleService.          createIfNotExists(data));
    await runSequentially(data?.permissions,      async data => await PermissionService.    createIfNotExists(data));
    await runSequentially(data?.usersRolesSites,  async data => await UserRoleSiteService.  createIfNotExists(data));
    await runSequentially(data?.roleParentsSites, async data => await RoleParentSiteService.createIfNotExists(data));
    await runSequentially(data?.userGroups,       async data => await UserGroupService.     createIfNotExists(data));
}
