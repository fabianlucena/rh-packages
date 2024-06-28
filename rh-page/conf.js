import url from 'url';
import path from 'path';

const name = 'rhPage';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Page',
  version: '0.1',
  path: dirname,
  schema: 'page',
  routesPath: dirname + '/routes',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
};
