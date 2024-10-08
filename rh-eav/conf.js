import url from 'url';
import path from 'path';

const name = 'rhEav';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH EAV',
  version: '0.1',
  path: dirname,
  schema: 'eav',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: dirname + '/icons',
};
