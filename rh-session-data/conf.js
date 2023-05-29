'use strict';

import url from 'url';
import path from 'path';

const name = 'rhSessionData';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Session data',
    version: '0.1',
    schema: 'auth',
    init: null,
    configure: null,
    modelsPath: dirname + '/models',
    servicesPath: dirname + '/services',
};
