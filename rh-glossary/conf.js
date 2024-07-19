import url from 'url';
import path from 'path';

const name = 'rhGlossary';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Glossary',
  version: '0.1',
  path: dirname,
  schema: 'glossary',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: dirname + '/icons',
};
