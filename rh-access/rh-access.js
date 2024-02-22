import {RoleService} from './services/role.js';
import {RoleParentSiteService} from './services/role_parent_site.js';
import {PermissionService} from './services/permission.js';
import {RolePermissionService} from './services/role_permission.js';
import {UserSiteRoleService} from './services/user_site_role.js';
import {UserGroupService} from './services/user_group.js';
import {ShareTypeService} from './services/share_type.js';
import {AssignableRolePerRoleService} from './services/assignable_role_per_role.js';
import {PrivilegesService} from './services/privileges.js';
import {SessionSiteService} from './services/session_site.js';
import {PrivilegesController} from './controllers/privileges.js';
import {NoPermissionError} from 'http-util';
import {runSequentially} from 'rf-util';
import {conf as localConf} from './conf.js';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

function configure(global) {
    if (global.router) {
        global.router.use(PrivilegesController.middleware());
    }

    global.checkPermissionHandler = getCheckPermissionHandler(global.checkPermissionHandler);

    global.eventBus?.$on('login', login);
    global.eventBus?.$on('sessionUpdated', sessionUpdated);
}

function getCheckPermissionHandler(chain) {
    return async (req, ...requiredPermissions) => {
        if (await checkPermissionForUsernameAndSiteName(req, ...requiredPermissions)) {
            return;
        }

        if (await chain(req, ...requiredPermissions)) {
            return;
        }

        throw new NoPermissionError({permissions: requiredPermissions});
    };
}

async function checkPermissionForUsernameAndSiteName(privileges, ...requiredPermissions) {
    if (!privileges) {
        return false;
    }

    if (privileges.roles?.includes('admin')) {
        return true;
    }

    const permissions = privileges.permissions;
    if (!permissions) {
        return false;
    }
        
    for (let i = 0, e = requiredPermissions.length; i < e; i++) {
        if (permissions.includes(requiredPermissions[i])) {
            return true;
        }
    }

    return false;
}

async function updateData(global) {
    const data = global?.data;
    if (!data) {
        return;
    }

    const
        roleService =                  RoleService.                 singleton(),
        permissionService =            PermissionService.           singleton(),
        rolePermissionService =        RolePermissionService.       singleton(),
        userSiteRoleService =          UserSiteRoleService.         singleton(),
        roleParentSiteService =        RoleParentSiteService.       singleton(),
        userGroupService =             UserGroupService.            singleton(),
        shareTypeService =             ShareTypeService.            singleton(),
        assignableRolePerRoleService = AssignableRolePerRoleService.singleton();

    await runSequentially(data?.roles,                   async data => await roleService.                 createIfNotExists(data));
    await runSequentially(data?.permissions,             async data => await permissionService.           createIfNotExists(data));
    await runSequentially(data?.rolesPermissions,        async data => await rolePermissionService.       createIfNotExists(data));
    await runSequentially(data?.usersSitesRoles,         async data => await userSiteRoleService.         createIfNotExists(data));
    await runSequentially(data?.rolesParentsSites,       async data => await roleParentSiteService.       createIfNotExists(data));
    await runSequentially(data?.userGroups,              async data => await userGroupService.            createIfNotExists(data));
    await runSequentially(data?.shareTypes,              async data => await shareTypeService.            createIfNotExists(data));
    await runSequentially(data?.assignableRolesPerRoles, async data => await assignableRolePerRoleService.createIfNotExists(data));
}

async function login(data, options) {
    if (!options?.sessionId || !options?.oldSessionId) {
        return;
    }

    const sessionSiteService = SessionSiteService.singleton();
    const sessionId = options?.sessionId;
    const currentSite = await sessionSiteService.getList({where: {sessionId}});
    if (currentSite?.length)  {
        return;
    }

    const oldSite = await sessionSiteService.getList({where: {sessionId: options.oldSessionId}});
    if (!oldSite?.length) {
        return;
    }

    await sessionSiteService.createOrUpdate({sessionId, siteId: oldSite[0].siteId});
}

async function sessionUpdated(sessionId) {
    await PrivilegesService.singleton().deleteFromCacheForSessionId(sessionId);
}

