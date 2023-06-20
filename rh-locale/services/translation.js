'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {SourceService} from './source.js';
import {LanguageService} from './language.js';
import {ContextService} from './context.js';
import {DomainService} from './domain.js';
import {checkDataForMissingProperties, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class TranslationService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Translation;
    references = {
        source: {
            service: conf.global.services.Source,
            createIfNotExists: true,
            function: this.completeSourceId,
        },
        language: conf.global.services.Language,
        domain: {
            service: conf.global.services.Domain,
            createIfNotExists: true,
        },
        context: {
            service: conf.global.services.Context,
            createIfNotExists: true,
        },
    };

    /**
     * Complete the data object with the sourceId property if not exists. 
     * @param {{source: string, sourceId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeSourceId(data) {
        if (!data.sourceId && data.source)
            data.sourceId = await conf.global.services.Source.singleton().getIdOrCreateForTextAndIsJson(data.source, data.isJson, {data: {ref: data.ref}});

        return data;
    }

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'Translation', 'sourceId', 'languageId');

        return true;
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        await this.completeReferences(options.where, true);

        if (options.where.domainId === undefined && Object.prototype.hasOwnProperty.call(options.where, 'domainId'))
            options.where.domainId = null;

        if (options.where.contextId === undefined && Object.prototype.hasOwnProperty.call(options.where, 'contextId'))
            options.where.contextId = null;

        return options;
    }

    async _gt(language, texts, options) {
        if (!texts?.length)
            return {};

        const translations = {};
        if (!language) {
            for (const text of texts)
                translations[text] = text;

            return translations;
        }

        options ??= {};
        
        for (const text of texts) {
            let translation;

            if (typeof text === 'function') {
                translation = text();
            } else {
                let arrangedText;
                options.isJson ??= false;
                if (Array.isArray(text)) {
                    options.isJson = true;
                    arrangedText = JSON.stringify(text);
                } else
                    arrangedText = text;

                options.domain ??= null;

                if (arrangedText === null || arrangedText === undefined) {
                    translations[arrangedText] = arrangedText;
                    continue;
                }
                
                arrangedText = arrangedText.trim();
                let translationObject = await conf.global.models.TranslationCache.findOne({where: {language, context: options.context ?? null, domain: options.domain ?? null, source: arrangedText, isJson: options.isJson}});
                if (!translationObject) {
                    const bestTranslation = await TranslationService.singleton().getBestMatchForLanguageTextIsJsonContextsAndDomains(language, arrangedText, options.isJson, options.context, options.domain);
                    if (bestTranslation) {
                        const source = await SourceService.singleton().getForTextAndIsJson(arrangedText, options.isJson);
                        translationObject = await conf.global.models.TranslationCache.create({
                            language,
                            domain: options.domain,
                            context: options.context,
                            source: arrangedText,
                            isJson: options.isJson,
                            translation: bestTranslation.translation,
                            ref: source.ref,
                            isTranslated: bestTranslation.isTranslated,
                            isDraft: bestTranslation.isDraft
                        });
                    }
                }

                if (translationObject.isJson)
                    translation = JSON.parse(translationObject.translation);
                else
                    translation = translationObject.translation;
            }

            translations[text] = translation;
        }
        
        return translations;
    }

    async getBestMatchForLanguageTextIsJsonContextsAndDomains(language, text, isJson, contexts, domains) {
        if (!language)
            return {translation: text, isTranslated: false, isDraft: true};

        const sourceId = await SourceService.singleton().getIdOrCreateForTextAndIsJson(text, isJson);
        let contextsId = [];
        let domainsId = [];
        
        if (contexts) {
            if (!Array.isArray(contexts))
                contexts = contexts.split(',').map(t => t.trim());
            
            contextsId = await ContextService.singleton().getIdOrCreateForName(contexts);
            if (!contextsId.length && contexts.some(c => !c))
                contextsId.push(null);
        } else 
            contextsId.push(null);

        if (domains) {
            if (!Array.isArray(domains))
                domains = domains.split(',').map(t => t.trim());
            
            domainsId = await DomainService.singleton().getIdOrCreateForName(domains);
            if (!domainsId.length && domains.some(c => !c))
                domainsId.push(null);
        } else 
            domainsId.push(null);
        
        let languageData = await LanguageService.createIfNotExists({name: language.trim(), title: language.trim()});
        while (languageData.id) {
            const data = {
                sourceId,
                languageId: languageData.id,
            };

            let translation;
            for (const domainId of domainsId) {
                for (const contextId of contextsId) {
                    const options = {
                        where: {...data,  domainId, contextId},
                        limit: 1
                    };
                    translation = await conf.global.models.Translation.findAll(options);

                    if (translation.length) {
                        if (translation[0].text)
                            return {translation: translation[0].text, isTranslated: true, isDraft: translation[0].isDraft};
                    }
                }
            }

            if (!languageData.parentId) 
                break;

            languageData = await LanguageService.get(languageData.parentId);
        }

        return {translation: text, isTranslated: false, isDraft: true};
    }

    /**
     * Gets a translation for its language, source, and domain. For many coincidences and for no rows this method fails.
     * @param {string} language - language for the translation to get.
     * @param {string} source - source for the translation to get.
     * @param {string} domain - domain for the translation to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Language}}
     */
    async getForLanguageSourceAndDomain(language, source, domain, options) {
        return this.getList(deepComplete(options, {where:{language, source, domain: domain ?? null}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['translation', 'source', source, 'translation']})));
    }
    
    /**
     * Creates a new tranlaion row into DB if not exists.
     * @param {data} data - data for the new Language @see create.
     * @returns {Promise{Language}}
     */
    async createIfNotExists(data, options) {
        await this.completeReferences(data);

        const rows = await this.getList({where:{languageId: data.languageId, sourceId: data.sourceId, domainId: data.domainId, ...options?.where}, limit: 1, ...options});
        if (rows.length)
            return rows[0];

        data.text = data.translation;

        return this.create(data);
    }
}