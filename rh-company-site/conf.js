'use strict';

import url from 'url';
import path from 'path';

const name = 'rhCompany';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'Company Site',
    version: '0.1',
    schema: 'company',
    modelsPath: dirname + '/models',
};
