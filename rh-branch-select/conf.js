import url from 'url';
import path from 'path';

const name = 'rhBranchSelect';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Select Branch',
  version: '0.1',
  path: dirname,
  schema: 'branch',
  routesPath: dirname + '/routes',
  servicesPath: dirname + '/services',
};
