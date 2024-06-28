import url from 'url';
import path from 'path';

const 
  name = 'rhIcon',
  dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Icon',
  version: '0.1',
  path: dirname,
  schema: 'icon',
  iconsPath: `${dirname}/icons`,
  controllersPath: `${dirname}/controllers`,
  servicesPath: `${dirname}/services`,
  iconExtensions: [
    'svg',
    'ico',
    'png',
    'gif',
    'jpg',
    'jpeg',
  ],
};
