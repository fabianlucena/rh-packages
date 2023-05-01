'use strict';

import {stripQuotes, loadJson} from './utils.js';
import fs from 'fs';

export async function showTranslationsFile(options) {
    let translations = await loadJson(options.translationsFilename, {emptyIfNotExists: true});
    if (!translations)
        translations = {};

    for (let t in translations) {
        const translation = translations[t];
        let msg = '\x1b[34m' + translation.source + '\x1b[90m - ';
        if (translation.draft)
            msg += '\x1b[33m [draft] ';
        if (!translation.used)
            msg += '\x1b[91m [unused] ';
        if (translation.translation)
            msg += '\x1b[97m' + translation.translation;
        else
            msg += '\x1b[90m<no translation>';
        msg += '\x1b[0m';
        console.log(msg);
    }
}