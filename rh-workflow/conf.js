import url from 'url';
import path from 'path';

const name = 'rhWorkflow';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Workflow',
  version: '0.1',
  path: dirname,
  schema: 'workflow',
  modelsPath: `${dirname}/models`,
  servicesPath: `${dirname}/services`,
  controllersPath: `${dirname}/controllers`,
  iconsPath: `${dirname}/icons`,
};
