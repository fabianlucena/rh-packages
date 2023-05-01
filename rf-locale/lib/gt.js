'use strict';

import {glob} from 'glob';
import {extractSourcesFromFile} from './extract.js';
import {getOptionsFromArgs} from './options.js';
import {updateTranslationsFile} from './update_translations_file.js';
import {validateTranslationsFile} from './validate_translations_file.js';
import {showTranslationsFile} from './show_translations_file.js';
import {createTranslationModule} from './create_translation_module.js';

const options = getOptionsFromArgs(
    {},
    {
        switchOptions: [
            '--hello-world',
            '--show-options',
            '--show-paths',
            '--show-files',
            '--show-sources',
            '--show-translations',
            '--show-translations-file',
            '--skip-extraction',
            '--keep-unused',
            '--update-translations-file',
            '--validate-translations-file',
            '--detailed-translation',
            '--overwrite',
        ],
        valueOptions: [
            '--language',
            '--language-title',
            '--ignore',
            '--translations-filename',
            '--create-translation-module'
        ],
        multipleOptions: [
            '--path'
        ],
        defaultOption: '--path'
    });

if (!options.paths?.length
    && !options.createTranslationModule
    && !options.updateTranslationsFile
    && !options.showTranslationsFile
    && !options.validateTranslationsFile
)
    options.paths = ['./**/*.js'];

if (options.showOptions) {
    console.log(options);
}

if (options.helloWorld) {
    console.log('Hello world!');
    process.exit();
}

options.patterns ??= {
    '_': {sourceMap: {0:0}},
    '_f': {sourceMap: {0:0}},
    '_d': {domainIndex: 0, sourceMap: {0:1}},
    '_n': {nIndex: 0, sourceMap: {0: null, 1: 1, 2: 2}},
    '_nn': {nIndex: 0, sourceMap: {0: 1, 1: 2, 2: 3}},
    '_nf': {nIndex: 0, sourceMap: {0: null, 1: 1, 2: 2}},
    '_nnf': {nIndex: 0, sourceMap: {0: 1, 1: 2, 2: 3}},
    '_nd': {domainIndex: 0, nIndex: 1, sourceMap: {0: null, 1: 2, 2: 3}},
    '_nnd': {domainIndex: 0, nIndex: 1, sourceMap: {0: 2, 1: 3, 2: 4}},
};

for (let p in options.paths) {
    const path = options.paths[p];
    if (options.showPaths)
        console.log(path);

    const files = await glob(path, options);
    for (let f in files) {
        const file = files[f];
        if (options.showFiles)
            console.log(file);

        if (!options.skipExtraction)
            extractSourcesFromFile(file, options);
    }
}

if (options.showSources)
    console.log(options.sources);

if (options.createTranslationModule)
    await createTranslationModule(options);

if (options.updateTranslationsFile)
    await updateTranslationsFile(options);

if (options.showTranslationsFile)
    await showTranslationsFile(options);

if (options.validateTranslationsFile)
    await validateTranslationsFile(options);