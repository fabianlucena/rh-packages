import url from 'url';
import path from 'path';

const name = 'rhMainCompany';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Main company',
  version: '0.1',
  path: dirname,
  schema: 'company',
  routesPath: dirname + '/routes',
  servicesPath: dirname + '/services',
};
