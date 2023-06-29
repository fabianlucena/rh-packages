'use strict';

import {loc} from 'rf-locale';

const name = 'qaait';

export const data = {
    permissions: [
        {name: 'project-select.switch', title: loc._cf('permission', 'Select project'), isTranslatable: true, ownerModule: name, menuItem: {title: loc._cf('menu', 'Select project'), isTranslatable: true, action: 'object', service: 'project-select'}},
    ],
};
