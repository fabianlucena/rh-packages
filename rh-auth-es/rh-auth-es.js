'use strict';

import {loc, loadJson} from 'rf-locale';
import url from 'url';
import path from 'path';

const name = 'rh-auth-es';
const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conf = {
    name,
    title: 'RhAuth-es',
    version: '0.1',
    translationsFilename: './translations_es.json',
    data: {
        languages: {
            'es': {
                title: loc._f('Spanish'),
                description: loc._f('Spanish language.'),
                paremt: '',
                pluralsCount: 3,
                plurals: 'n => (n < 2)? n: 2'
            },
        },

        translations: () => loadJson(dirname + '/translations_es.json'),
    },
};