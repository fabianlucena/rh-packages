import url from 'url';
import path from 'path';

const name = 'rhAsset';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Asset',
  version: '0.1',
  path: dirname,
  schema: 'asset',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: dirname + '/icons',
};
