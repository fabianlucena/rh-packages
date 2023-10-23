import {loc} from 'rf-locale';

const name = 'rhCompanySite';

export const data = {
    permissions: [        
        {name: 'company-site.switch', title: loc._cf('permission', 'Select company'), isTranslatable: true, roles: 'everybody', ownerModule: name, menuItem: {label: loc._cf('menu', 'Select company'), isTranslatable: true, action: 'object', service: 'company-site', toolbarIcon: 'company-site-switch'}},
    ],
};
