'use strict';

import {LocaleController} from './controllers/locale.js';
import {conf as localConf} from './conf.js';
import {LanguageService} from './services/language.js';
import {TranslationService} from './services/translation.js';
import {runSequentially} from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

function configure(global) {
    if (global.router) {
        global.router.use(LocaleController.middleware());
    }
}

async function updateData(global) {
    const data = global?.data;
    if (!data) {
        return;
    }
        
    const languageService = LanguageService.singleton();
    const translationService = TranslationService.singleton();
    await runSequentially(data?.languages,    async data => await languageService.   createIfNotExists(data));
    await runSequentially(data?.translations, async data => await translationService.createIfNotExists(data));
}
