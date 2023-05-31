'use strict';

import {LocaleController} from './controllers/locale.js';
import {conf as localConf} from './conf.js';
import {LanguageService} from './services/language.js';
import {TranslationService} from './services/translation.js';

export const conf = localConf;

conf.configure = configure;
conf.afterConfig = afterConfig;

function configure(global) {
    if (global.router)
        global.router.use(LocaleController.middleware());
}

async function afterConfig(global) {
    const languages = global?.data?.languages;
    for (const name in languages) {
        const data = languages[name];
        await LanguageService.createIfNotExists({...data, name});
    }

    const translations = global?.data?.translations;
    for (const source in translations) {
        const data = translations[source];
        await TranslationService.createIfNotExists({...data, source});
    }
}
