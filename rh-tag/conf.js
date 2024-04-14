import url from 'url';
import path from 'path';

const name = 'rhTag';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Tags',
  version: '0.1',
  path: dirname,
  schema: 'tag',
  init: null,
  configure: null,
  routesPath: dirname + '/routes',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  apis: [dirname + '/routes/*.js', dirname + '/controllers/*.js'],
};
