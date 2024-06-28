import { loc } from 'rf-locale';

const name = 'rhOAuth2Client';

export const data = {
  roles: [
    { name: 'oauth2ClientManager', title: loc._cf('role', 'OAuth2 client manager'),         isTranslatable: true, ownerModule: name },
  ],

  rolesParentsSites: [
    { role: 'admin', parent: 'oauth2ClientManager', site: 'system', ownerModule: name },
  ],

  permissions: [
    { name: 'oauth2Client.get',    title: loc._cf('premission', 'Get OAuth2 client(s)'), isTranslatable: true, roles: 'oauth2ClientManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'OAuth2 Client'), isTranslatable: true, icon: 'oauth2-client', parent: 'administration', action: 'grid', service: 'oauth2-client' }},
    { name: 'oauth2Client.create', title: loc._cf('premission', 'Create OAuth2 client'), isTranslatable: true, roles: 'oauth2ClientManager', ownerModule: name },
    { name: 'oauth2Client.edit',   title: loc._cf('premission', 'Edit OAuth2 client'),   isTranslatable: true, roles: 'oauth2ClientManager', ownerModule: name },
    { name: 'oauth2Client.delete', title: loc._cf('premission', 'Delete OAuth2 client'), isTranslatable: true, roles: 'oauth2ClientManager', ownerModule: name },
  ],
};
