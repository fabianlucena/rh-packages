import url from 'url';
import path from 'path';

const name = 'rhProjectSelect';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Select Project',
  version: '0.1',
  path: dirname,
  schema: 'project',
  routesPath: dirname + '/routes',
  servicesPath: dirname + '/services',
};
