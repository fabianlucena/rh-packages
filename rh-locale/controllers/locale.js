'use strict';

import {TranslationService} from '../services/translation.js';
import {Locale} from 'rf-locale';

const l = new Locale({
    driver: (language, text, domains) => TranslationService._gt(language, text, domains),
});

export function middleware() {
    return (req, res, next) => {
        req.l = l.clone()
            .setOptions({language: 'es-AR'});

        next();
    };
}
