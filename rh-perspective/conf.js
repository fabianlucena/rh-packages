import url from 'url';
import path from 'path';

const name = 'rhPerspective';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Perspective',
  version: '0.1',
  schema: 'perspective',
  configure: null,
  servicesPath: dirname + '/services',
  modelsPath: dirname + '/models',
  controllersPath: dirname + '/controllers',
  iconstPath: dirname + '/iconst',
};
