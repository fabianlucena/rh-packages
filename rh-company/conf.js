import { loc } from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rhCompany';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Company',
  version: '0.1',
  schema: 'company',
  routesPath: `${dirname}/routes`,
  modelsPath: `${dirname}/models`,
  servicesPath: `${dirname}/services`,
  controllersPath: `${dirname}/controllers`,
  iconsPath: `${dirname}/icons`,
  data: {
    roles: [
      { name: 'companyManager', title: loc._cf('role', 'Company manager'), isTranslatable: true, ownerModule: name },
    ],

    rolesParentsSites: [
      { role: 'admin', parent: 'companyManager', site: 'system', ownerModule: name },
    ],

    permissions: [
      { name: 'company.get',    title: loc._cf('permission', 'Get companies'),    isTranslatable: true, roles: 'companyManager', ownerModule: name, menuItem: { label: loc._cf('menu', 'Companies'), isTranslatable: true, parent: 'administration', action: 'grid', service: 'company' }},
      { name: 'company.create', title: loc._cf('permission', 'Create companies'), isTranslatable: true, roles: 'companyManager', ownerModule: name, },
      { name: 'company.edit',   title: loc._cf('permission', 'Edit companies'),   isTranslatable: true, roles: 'companyManager', ownerModule: name, },
      { name: 'company.delete', title: loc._cf('permission', 'Delete companies'), isTranslatable: true, roles: 'companyManager', ownerModule: name, },
    ],
  },
};
