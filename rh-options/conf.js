import url from 'url';
import path from 'path';

const name = 'rhOptions';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Options',
  version: '0.1',
  path: dirname,
  controllersPath: dirname + '/controllers',
};
