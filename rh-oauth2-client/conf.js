import url from 'url';
import path from 'path';

const name = 'rhOAuth2Client';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
  name,
  title: 'RH OAuth2 Client',
  version: '0.1',
  path: dirname,
  schema: 'oauth2',
  modelsPath: dirname + '/models',
  servicesPath: dirname + '/services',
  controllersPath: dirname + '/controllers',
  iconsPath: `${dirname}/icons`,
};
