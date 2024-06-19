import url from 'url';
import path from 'path';

const name = 'rhOauthClient';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH OAuth 2 Client',
  version: '0.1',
  schema: 'menu',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
};
