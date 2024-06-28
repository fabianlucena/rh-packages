import url from 'url';
import path from 'path';

const name = 'rhSite';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Sites',
  version: '0.1',
  path: dirname,
  schema: 'syst',
  init: null,
  configure: null,
  routesPath: dirname + '/routes',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: dirname + '/icons',
};
