import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const name = 'rhAuth';

export const conf = {
    name,
    title: 'RH Authorization',
    version: '0.1',
    schema: 'auth',
    init: [],
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    controllersPath: dirname + '/controllers',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    data: {
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

        permissions: [
            {name: 'login-menu',          title: loc._cf('premission', 'Login menu'),            isTranslatable: true, roles: 'anonymous',   ownerModule: name, menuItem: {alias: 'session-menu', icon: 'login',                                       action: 'form',    service: 'login'}},
            {name: 'session-menu',        title: loc._cf('premission', 'Session menu'),          isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {alias: 'session-menu', icon: 'session'}},
            
            {name: 'logout',              title: loc._cf('premission', 'Logout'),                isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._cf('menu', 'Logout'),                            parent: 'session-menu', action: 'apiCall', service: 'logout', method: 'post', onSuccess: 'clearBearerAuthorization(); clearApiData(); reloadMenu();', redirectTo: '/'}},
            {name: 'user.get',            title: loc._cf('premission', 'Get user(s)'),           isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Users'),       isTranslatable: true,                         action: 'grid',    service: 'user'}},
            {name: 'user.create',         title: loc._cf('premission', 'Create user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'user.edit',           title: loc._cf('premission', 'Edit user'),             isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'user.delete',         title: loc._cf('premission', 'Delete user'),           isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'session.get',         title: loc._cf('premission', 'Get session(s)'),        isTranslatable: true, roles: 'userManager', ownerModule: name, menuItem: {label: loc._cf('menu', 'Sessions'),    isTranslatable: true,                         action: 'grid',    service: 'session'}},
            {name: 'session.delete',      title: loc._cf('premission', 'Delete session'),        isTranslatable: true, roles: 'userManager', ownerModule: name},
            {name: 'ownsession.get',      title: loc._cf('premission', 'Get own sessions only'), isTranslatable: true, roles: 'user',        ownerModule: name, menuItem: {label: loc._cf('menu', 'My sessions'), isTranslatable: true, parent: 'session-menu', action: 'grid',    service: 'session'}},
            {name: 'current-site.switch', title: loc._cf('premission', 'Switch site'),           isTranslatable: true, roles: 'everybody',   ownerModule: name},
            {name: 'current-site.get',    title: loc._cf('premission', 'Get current site'),      isTranslatable: true, roles: 'everybody',   ownerModule: name},
        ],
    },
};
