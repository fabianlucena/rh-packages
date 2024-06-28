import url from 'url';
import path from 'path';

const name = 'rhCompanySite';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Company site',
  version: '0.1',
  path: dirname,
  schema: 'company',
  modelsPath: dirname + '/models',
  routesPath: dirname + '/routes',
  servicesPath: dirname + '/services',
};
