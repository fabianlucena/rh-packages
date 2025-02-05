import { loc } from 'rf-locale';

const name = 'rhAccess';

export const data = {
  roles: [
    { name: 'userAccessManager', title: loc._cf('role', 'User access manager'), isTranslatable: true, ownerModule: name },
    { name: 'membersManager',    title: loc._cf('role', 'Members manager'),     isTranslatable: true, ownerModule: name },
    { name: 'groupsManager',     title: loc._cf('role', 'Groups manager'),      isTranslatable: true, ownerModule: name },
  ],

  shareTypes: [
    { name: 'owner',  title: loc._cf('shareType', 'Owner') },
    { name: 'editor', title: loc._cf('shareType', 'Editor') },
    { name: 'viewer', title: loc._cf('shareType', 'Viewer') },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'userAccessManager', site: 'system', ownerModule: name },
    { role: 'admin', parent: 'groupsManager',     site: 'system', ownerModule: name },
  ],

  usersSitesRoles: [
    { username: 'admin', role: 'admin', site: 'system' },
  ],

  menuItems: [
    { name: 'administration',      isTranslatable: true, ownerModule: name, data: { label: loc._cf('premission', 'Administration'), icon: 'administration' }},
  ],

  permissions: [
    { name: 'user-access.create', title: loc._cf('permission', 'Add users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name },
    { name: 'user-access.get',    title: loc._cf('permission', 'Get users accesses'),    isTranslatable: true, roles: 'userAccessManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'Users accesses'), icon: 'user-access', isTranslatable: true, parent: 'administration', action: 'grid',   service: 'user-access' }},
    { name: 'user-access.edit',   title: loc._cf('permission', 'Edit users accesses'),   isTranslatable: true, roles: 'userAccessManager', ownerModule: name },
    { name: 'user-access.delete', title: loc._cf('permission', 'Delete users accesses'), isTranslatable: true, roles: 'userAccessManager', ownerModule: name },

    { name: 'privileges',         title: loc._cf('permission', 'Privileges'),            isTranslatable: true, roles: 'user',              ownerModule: name, menuItem: { label: loc._cf('menu', 'Privileges'),     icon: 'privileges',  isTranslatable: true, parent: 'session-menu',   action: 'object', service: 'privileges' }},

    { name: 'member.get',         title: loc._cf('permission', 'Get members'),           isTranslatable: true, roles: 'membersManager',    ownerModule: name, menuItem: { label: loc._cf('menu', 'Members'),        icon: 'members',     isTranslatable: true, parent: 'administration', action: 'grid',                             service: 'member' }},
    { name: 'member.create',      title: loc._cf('permission', 'Create members'),        isTranslatable: true, roles: 'membersManager',    ownerModule: name },
    { name: 'member.edit',        title: loc._cf('permission', 'Edit members'),          isTranslatable: true, roles: 'membersManager',    ownerModule: name },
    { name: 'member.delete',      title: loc._cf('permission', 'Delete members'),        isTranslatable: true, roles: 'membersManager',    ownerModule: name },    

    { name: 'group.get',          title: loc._cf('permission', 'Get groups'),            isTranslatable: true, roles: 'groupsManager',     ownerModule: name, menuItem: { label: loc._cf('menu', 'Groups'),         icon: 'group',       isTranslatable: true, parent: 'administration', action: 'grid',                             service: 'group' }},
    { name: 'group.create',       title: loc._cf('permission', 'Create groups'),         isTranslatable: true, roles: 'groupsManager',     ownerModule: name },
    { name: 'group.edit',         title: loc._cf('permission', 'Edit groups'),           isTranslatable: true, roles: 'groupsManager',     ownerModule: name },
    { name: 'group.delete',       title: loc._cf('permission', 'Delete groups'),         isTranslatable: true, roles: 'groupsManager',     ownerModule: name },    
  ],
};
