import url from 'url';
import path from 'path';

const name = 'rhMenu';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Menu',
  version: '0.1',
  schema: 'menu',
  modelsPath: `${dirname}/models`,
  servicesPath: `${dirname}/services`,
  controllersPath: `${dirname}/controllers`,
  iconsPath: `${dirname}/icons`,
};
