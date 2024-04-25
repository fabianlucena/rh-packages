import url from 'url';
import path from 'path';

const name = 'rhModule';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Modules',
  version: '0.1',
  schema: 'syst',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
};
