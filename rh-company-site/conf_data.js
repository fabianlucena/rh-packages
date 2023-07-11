'use strict';

import {loc} from 'rf-locale';

const name = 'qaait';

export const data = {
    permissions: [        
        {name: 'company-site.switch', title: loc._cf('permission', 'Select company'), isTranslatable: true, ownerModule: name, menuItem: {label: loc._cf('menu', 'Select company'), isTranslatable: true, action: 'object', service: 'company-site'}},
    ],
};
