'use strict';

import url from 'url';
import path from 'path';

const name = 'rhProjectTag';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RH Project Tag',
    version: '0.1',
    path: dirname,
    schema: 'project',
    servicesPath: dirname + '/services',
};
