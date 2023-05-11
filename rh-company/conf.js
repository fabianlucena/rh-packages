'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhCompany';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Company',
    version: '0.1',
    schema: 'company',
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        roles: [
            {name: 'companyManager', title: loc._f('Company manager'), ownerModule: name},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'companyManager', site: 'system', ownerModule: name},
        ],

        permissions: [
            {name: 'company.get',    title: loc._f('Get companies'),    roles: 'companyManager', ownerModule: name, menuItem: {name:'company.get', label: loc._f('Companies'), action: 'grid', service: 'company'}},
            {name: 'company.create', title: loc._f('Create companies'), roles: 'companyManager', ownerModule: name,},
            {name: 'company.edit',   title: loc._f('Edit companies'),   roles: 'companyManager', ownerModule: name,},
            {name: 'company.delete', title: loc._f('Delete companies'), roles: 'companyManager', ownerModule: name,},
        ],
    },
};
