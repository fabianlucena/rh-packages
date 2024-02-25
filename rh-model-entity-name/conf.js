import url from 'url';
import path from 'path';

const name = 'rhModelEntityName';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Model Entity Name',
    version: '0.1',
    path: dirname,
    schema: 'syst',
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
};
