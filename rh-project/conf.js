import url from 'url';
import path from 'path';

const name = 'rhProject';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Project',
  version: '0.1',
  path: dirname,
  schema: 'project',
  routesPath: `${dirname}/routes`,
  modelsPath: `${dirname}/models`,
  servicesPath: `${dirname}/services`,
  controllersPath: `${dirname}/controllers`,
  iconsPath: `${dirname}/icons`,
};
