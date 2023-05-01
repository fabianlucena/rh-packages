'use strict';

import {loc, loadJson} from 'rf-locale';

const name = 'rh-auth-es';

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
                plurals: 'n => (n < 2)? n: 2'
            },
        },

        translations: () => loadJson('./translations_es.json'),
    },
};