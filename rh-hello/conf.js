import url from 'url';
import path from 'path';

const name = 'rhHello';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH Hello',
  version: '0.1',
  path: dirname,
  controllersPath: dirname + '/controllers',
};
