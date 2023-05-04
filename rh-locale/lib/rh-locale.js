'use strict';

import {getOptionsFromArgs} from './options.js';
import {createTranslationModule} from './create_translation_module.js';


const options = getOptionsFromArgs(
    {},
    {
        switchOptions: [
            '--show-options',
            '--update-translations-file',
            '--extract-translations-file',
            '--validate-translations-file',
            '--overwrite',
        ],
        valueOptions: [
            '--language',
            '--language-title',
            '--ignore',
            '--translations-filename',
            '--create-translation-module'
        ],
        
    });

if (options.showOptions) {
    console.log(options);
}

if (options.createTranslationModule)
    await createTranslationModule(options);