import url from 'url';
import path from 'path';

const name = 'rhBranch';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Branch',
  version: '0.1',
  path: dirname,
  schema: 'branch',
  routesPath: dirname + '/routes',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
};
