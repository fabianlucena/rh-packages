'use strict';

import {TranslationService} from '../services/translation.js';
import {Locale} from 'rf-locale';

const loc = new Locale({
    driver: (language, text, domains) => TranslationService._gt(language, text, domains),
});

export class LocaleController {
    static middleware() {
        return (req, res, next) => {
            req.loc = loc.clone()
                .setOptions({language: 'es'});
    
            next();
        };
    }

    static async post(req, res) {
        if (req.body?.gt) {
            const data = {};
            if (typeof req.body.gt === 'string') {
                data.gt = {};
                data.gt[req.body.gt] = await req.loc._(req.body.gt);
            } else if (req.body.gt instanceof Array) {
                data.gt = await req.loc.getTextRaw(req.body.gt);
            }

            res.status(200).send(data);
        } else
            res.status(200).send();
    }
}