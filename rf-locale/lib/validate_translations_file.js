'use strict';

import {simplePrompt} from './simple_prompt.js';
import {stripQuotes, loadJson} from './utils.js';
import fs from 'fs';

export async function validateTranslationsFile(options) {
    let translations = await loadJson(options.translationsFilename, {emptyIfNotExists: true});
    if (!translations)
        translations = {};

    let terminatedByUser = false
    console.log('Please enter the following translations.');
    for (let t in translations) {
        const translation = translations[t];
        if (!translation.translation || translation.draft) {
            const trans = await simplePrompt(t);
            if (!trans) {
                const answer = await simplePrompt('Do you want to terminate? [y|n|<empty>] (empty put blank space for this translation)');
                if (answer) {
                    if (answer[0].toUpperCase() === 'Y') {
                        terminatedByUser = true;
                        break;
                    } else
                        continue;
                }
            }

            translation.translation = trans;
        }
    }

    let saveToFile;
    if (terminatedByUser) {
        saveToFile = false;
        const answer = await simplePrompt('Do you want to save the current work to file? [Y|n]');
        saveToFile = !answer || answer[0].toUpperCase() === 'Y';
    } else
        saveToFile = true

    if (saveToFile) {
        const json = JSON.stringify(translations, null, 4);
        fs.writeFileSync(options.translationsFilename, json);
    }
}