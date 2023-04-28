'use strict';

import {middleware} from './controllers/locale.js';
import {conf as localConf} from './conf.js';
import {LanguageService} from './services/language.js';

export const conf = localConf;

conf.configure = configure;
conf.afterConfigAsync = afterConfigAsync;

function configure(global) {
    if (global.router)
        global.router.use(middleware());
}

async function afterConfigAsync(_, global) {
    const languages = global?.data?.languages;
    for (const name in languages) {
        const data = languages[name];
        await LanguageService.createIfNotExists({...data, name});
    }
}
