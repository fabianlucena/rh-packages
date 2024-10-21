import { PrivilegesController } from './controllers/privileges.js';
import { NoPermissionError } from 'http-util';
import { runSequentially } from 'rf-util';
import { conf as localConf } from './conf.js';
import dependency from 'rf-dependency';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;
conf.init = [init];

function configure(global) {
  if (global.router) {
    global.router.use(PrivilegesController.middleware());
  }

  const previousHandler = global.checkPermissionHandler;
  global.checkPermissionHandler = getCheckPermissionHandler(previousHandler);

  global.eventBus?.$on('login', login);
  global.eventBus?.$on('sessionUpdated', sessionUpdated);
}

function init() {
  conf.sessionSiteService = dependency.get('sessionSiteService');
  conf.privilegesService  = dependency.get('privilegesService');
}

function getCheckPermissionHandler(chain) {
  return async (req, ...requiredPermissions) => {
    if (await checkPermissionForUsernameAndSiteName(req, ...requiredPermissions)) {
      return;
    }

    if (await chain(req, ...requiredPermissions)) {
      return;
    }

    throw new NoPermissionError({ permissions: requiredPermissions });
  };
}

async function checkPermissionForUsernameAndSiteName(privileges, ...requiredPermissions) {
  if (!requiredPermissions.length) {
    return true;
  }

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
    roleService =                  dependency.get('roleService'),
    permissionService =            dependency.get('permissionService'),
    rolePermissionService =        dependency.get('rolePermissionService'),
    userSiteRoleService =          dependency.get('userSiteRoleService'),
    roleParentSiteService =        dependency.get('roleParentSiteService'),
    userGroupService =             dependency.get('userGroupService'),
    shareTypeService =             dependency.get('shareTypeService'),
    assignableRolePerRoleService = dependency.get('assignableRolePerRoleService');

  await runSequentially(data?.roles,                   async data => await roleService.                 createIfNotExists(data));
  await runSequentially(data?.permissions,             async data => await permissionService.           createIfNotExists(data));
  await runSequentially(data?.rolesPermissions,        async data => await rolePermissionService.       createIfNotExists(data));
  await runSequentially(data?.usersSitesRoles,         async data => await userSiteRoleService.         createIfNotExists(data));
  await runSequentially(data?.rolesParentsSites,       async data => await roleParentSiteService.       createIfNotExists(data));
  await runSequentially(data?.userGroups,              async data => await userGroupService.            createIfNotExists(data));
  await runSequentially(data?.shareTypes,              async data => await shareTypeService.            createIfNotExists(data));
  await runSequentially(data?.assignableRolesPerRoles, async data => await assignableRolePerRoleService.createIfNotExists(data));
}

async function login({ options }) {
  if (!options?.sessionId || !options?.oldSessionId) {
    return;
  }

  const sessionId = options?.sessionId;
  const currentSite = await conf.sessionSiteService.getList({ where: { sessionId }});
  if (currentSite?.length)  {
    return;
  }

  const oldSite = await conf.sessionSiteService.getList({ where: { sessionId: options.oldSessionId }});
  if (!oldSite?.length) {
    return;
  }

  await conf.sessionSiteService.createOrUpdate({ sessionId, siteId: oldSite[0].siteId });
}

async function sessionUpdated({ sessionId }) {
  await conf.privilegesService.deleteFromCacheForSessionId(sessionId);
}

