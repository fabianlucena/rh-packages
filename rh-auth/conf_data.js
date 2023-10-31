import {loc} from 'rf-locale';

const name = 'rhAuth';

export const data = {
    userTypes: [
        {name: 'user',  title: loc._cf('userType', 'User'),  isTranslatable: true, ownerModule: name},
        {name: 'group', title: loc._cf('userType', 'Group'), isTranslatable: true, ownerModule: name},
    ],

    identityTypes: [
        {name: 'local', title: loc._cf('identityType', 'Local'), isTranslatable: true},
    ],
    
    users: [
        {username: 'admin', displayName: loc._cf('user', 'Administrator'), isTranslatable: true, password: '1234', ownerModule: name},
    ],

    roles: [
        {name: 'everybody',   title: loc._cf('role', 'Everybody'),            isTranslatable: true, ownerModule: name},
        {name: 'anonymous',   title: loc._cf('role', 'Anonymous'),            isTranslatable: true, ownerModule: name},
        {name: 'user',        title: loc._cf('role', 'User'),                 isTranslatable: true, ownerModule: name},
        {name: 'admin',       title: loc._cf('role', 'System administrator'), isTranslatable: true, ownerModule: name},
        {name: 'userManager', title: loc._cf('role', 'User manager'),         isTranslatable: true, ownerModule: name},
    ],

    rolesParentsSites: [
        {role: 'admin', parent: 'userManager', site: 'system', ownerModule: name},
    ],

    menuItems: [
        {name: 'administration',      isTranslatable: true, roles: 'user',        ownerModule: name, data: {alias: 'administration', label: loc._cf('premission', 'Administration'), icon: 'administration'}},
    ],

    permissions: [
        {name: 'login-menu',          title: loc._cf('premission', 'Login menu'),            isTranslatable: true, roles: 'anonymous',   ownerModule: name, menuItem: {alias: 'session-menu',   icon: 'login',                                                       action: 'form',    service: 'login'}},
        {name: 'session-menu',        title: loc._cf('premission', 'Session menu'),          isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {alias: 'session-menu',   icon: 'session'}},

        {name: 'own-session.get',     title: loc._cf('premission', 'Get own sessions only'), isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._cf('menu', 'My sessions'),        isTranslatable: true, parent: 'session-menu',   action: 'grid',    service: 'session'}},
        {name: 'own-password.change', title: loc._cf('premission', 'Change own password'),   isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._cf('menu', 'Change my password'), isTranslatable: true, parent: 'session-menu',   action: 'form',    service: 'change-my-password'}},
        {name: 'logout',              title: loc._cf('premission', 'Logout'),                isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._cf('menu', 'Logout'),                                   parent: 'session-menu',   action: 'apiCall', service: 'logout',           method: 'post', onSuccess: 'clearBearerAuthorization(); clearApiData(); reloadMenu();', redirectTo: '/'}},

        {name: 'user.get',            title: loc._cf('premission', 'Get user(s)'),           isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Users'),              isTranslatable: true, parent: 'administration', action: 'grid',    service: 'user'}},
        {name: 'user.create',         title: loc._cf('premission', 'Create user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
        {name: 'user.edit',           title: loc._cf('premission', 'Edit user'),             isTranslatable: true, roles: 'userManager', ownerModule: name},
        {name: 'user.delete',         title: loc._cf('premission', 'Delete user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
        {name: 'session.get',         title: loc._cf('premission', 'Get session(s)'),        isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Sessions'),           isTranslatable: true, parent: 'administration', action: 'grid',    service: 'session'}},
        {name: 'session.delete',      title: loc._cf('premission', 'Delete session'),        isTranslatable: true, roles: 'userManager', ownerModule: name},
        {name: 'current-site.switch', title: loc._cf('premission', 'Switch site'),           isTranslatable: true, roles: 'everybody',   ownerModule: name},
        {name: 'current-site.get',    title: loc._cf('premission', 'Get current site'),      isTranslatable: true, roles: 'everybody',   ownerModule: name},
    ],
};
