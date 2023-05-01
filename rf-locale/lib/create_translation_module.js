'use strict';

import {simplePrompt} from './simple_prompt.js';
import {pascalize} from './utils.js';
import fs from 'fs';

const packageTemplate = `{
  "name": "{packageName}",
  "version": "1.0.0",
  "description": "{packageDescription}",
  "main": "{packageFilename}",
  "type": "module",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "update": "gt --update-translations-file ../{srcPackageName}/**/*.js **/*.js --translations-filename {translationsFilename}",
    "validate": "gt --validate-translations-file --translations-filename {translationsFilename}",
    "show": "gt --show-translations-file --translations-filename {translationsFilename}"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`;

const confTemplate = `'use strict';

import {loc, loadJson} from 'rf-locale';

const name = '{packageName}';

export const conf = {
    name,
    title: '{packageTitle}',
    version: '0.1',
    translationsFilename: '{translationsFilename}',
    data: {
        languages: {
            '{language}': {
                title: loc._f('{languageTitle}'),
                description: loc._f('{languageDescription}'),
                paremt: '{parent}',
                plurals: '{plural}'
            },
        },

        translations: () => loadJson('{translationsFilename}'),
    },
};`;

export async function createTranslationModule(options) {
    const srcPackageName = options.createTranslationModule;
    let language = options.language;
    while (!language) {
        language = await simplePrompt('Please enter the language code to create the module translation for (code ISO 639-1 or IETF recomended)');
        if (!language)
            console.log('Language code is mandatory, try again.')
    }

    const dir = './' + srcPackageName + '-' + language;
    if (fs.existsSync(dir)) {
        if (!options.overwrite) {
            const proceed = await simplePrompt(`The directory "${dir}" is not empty. Do you ant to proceed anyway? the files will be rewriten [y|N]`);
            if (!proceed || proceed[0].toUpperCase() != 'Y') {
                console.error(`The directory "${dir}" is not empty.`)
                process.exit();
            }
        }
    } else
        fs.mkdirSync(dir);

    const packageName = srcPackageName + '-' + language;
    const packageFilename = packageName + '.js';
    const packageTitle = pascalize(srcPackageName) + '-' + language;

    const translationsFilename = options.translationsFilename ?? (options.translationsPath ?? './') + `translations_${language}.json`;

    let languageTitle = options.languageTitle;
    while (!languageTitle) {
        languageTitle = await simplePrompt('Enter the language title in English');
        if (!languageTitle)
            console.log('Language title is mandatory, try again.')
    }

    const packageDescription = `Translation to ${languageTitle} for package ${srcPackageName}.`;

    const defaultLangDescription = `${languageTitle} language.`;
    let languageDescription = await simplePrompt(`Enter the language description in English (or empty for use: "${defaultLangDescription}")`);
    if (!languageDescription)
    languageDescription = defaultLangDescription;

    const parent = await simplePrompt(`Enter the parent language for this specification or leave empty for no parent`);

    let pluralsCount = await simplePrompt('How many forms have the plural forms (most languages use 3: no items, singular, and plural)? leave empty for 3');
    if (pluralsCount === '')
        pluralsCount = 3;

    let plural = await simplePrompt('Please enter plurals form or leave empty to use general form "n => (n < 2)? n: 2"');
    if (!plural)
        plural = 'n => (n < 2)? n: 2'
        
    fs.writeFileSync(
        dir + '/package.json',
        packageTemplate
            .replace(/\{packageName\}/g, packageName)
            .replace(/\{packageDescription\}/g, packageDescription)
            .replace(/\{packageFilename\}/g, packageFilename)
            .replace(/\{srcPackageName\}/g, srcPackageName)
            .replace(/\{language\}/g, language)
            .replace(/\{translationsFilename\}/g, translationsFilename)
    );

    fs.writeFileSync(
        dir + '/' + srcPackageName + '-' + language + '.js',
        confTemplate
            .replace(/\{packageName\}/g, packageName)
            .replace(/\{packageTitle\}/g, packageTitle)
            .replace(/\{language\}/g, language)
            .replace(/\{languageTitle\}/g, languageTitle)
            .replace(/\{languageDescription\}/g, languageDescription)
            .replace(/\{parent\}/g, parent)
            .replace(/\{pluralsCount\}/g, pluralsCount)
            .replace(/\{plural\}/g, plural)
            .replace(/\{translationsFilename\}/g, translationsFilename)
    );

    console.log(`${srcPackageName}-${language} translation module created.
Now use;
    cd ${srcPackageName}-${language}  ; to change the directory to recently created module and the following scripts for maintenance:
    npm run update   ; to get the source string to translate from code
    npm run vaidate  ; to enter interactively the traslations
    npm run show     ; to see the translations list`);
}