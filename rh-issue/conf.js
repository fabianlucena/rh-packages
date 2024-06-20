import url from 'url';
import path from 'path';

const name = 'rhIssue';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Issue',
  version: '0.1',
  path: dirname,
  schema: 'issue',
  routesPath: dirname + '/routes',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: dirname + '/icons',
};
