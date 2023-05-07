'use strict';

import {loc} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhProject';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Project',
    version: '0.1',
    schema: 'project',
    routesPath: dirname + '/routes',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
    apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
    afterConfigAsync: null,
    data: {
        roles: [
            {name: 'projectManager', title: loc._f('Project manager'), ownerModule: name},
        ],

        rolesParentsSites: [
            {role: 'admin', parent: 'projectManager', site: 'system', ownerModule: name},
        ],

        permissions: [
            {name: 'project.get',    title: loc._f('Get projects'),    roles: 'projectManager', ownerModule: name, menuItem: {name:'project.get', label: loc._f('Projects'), action: 'grid', service: 'project'}},
            {name: 'project.create', title: loc._f('Create projects'), roles: 'projectManager', ownerModule: name,},
            {name: 'project.edit',   title: loc._f('Edit projects'),   roles: 'projectManager', ownerModule: name,},
            {name: 'project.delete', title: loc._f('Delete projects'), roles: 'projectManager', ownerModule: name,},
        ],
    },
};
