'use strict';

import {conf} from '../conf.js';
import {SourceService} from './source.js';
import {LanguageService} from './language.js';
import {DomainService} from './domain.js';
import {checkDataForMissingProperties, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class TranslationService {
    /**
     * Complete the data object with the sourceId property if not exists. 
     * @param {{source: string, sourceId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSourceId(data) {
        if (!data.sourceId && data.source)
            data.sourceId = await conf.global.services.Source.getIdOrCreateForTextAndIsJson(data.source, data.isJson, {data: {ref: data.ref}});

        return data;
    }

    /**
     * Complete the data object with the languageId property if not exists. 
     * @param {{language: string, languageId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeLanguageId(data) {
        if (!data.languageId && data.language)
            data.languageId = await conf.global.services.Language.getIdForName(data.language);

        return data;
    }

    /**
     * Complete the data object with the domainId property if not exists. 
     * @param {{domain: string, domainId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeDomainId(data) {
        if (!data.domainId && data.domain)
            data.domainId = (await conf.global.services.Domain.getIdForName(data.domain)) ?? null;

        return data;
    }

    /**
     * Creates a new translation row into DB.
     * @param {{sourceId: string, title: string, description: string}} data - data for the new domain.
     *  - name: must be unique.
     *  - title: must be unique.
     * @returns {Promise{Domain}}
     */
    static async create(data) {
        await this.completeSourceId(data);
        await this.completeLanguageId(data);
        await this.completeDomainId(data);

        await checkDataForMissingProperties(data, 'Translation', 'sourceId', 'languageId');

        return conf.global.models.Translation.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        await this.completeSourceId(options.where);
        await this.completeLanguageId(options.where);
        await this.completeDomainId(options.where);

        delete options.where.source;
        delete options.where.language;
        delete options.where.domain;

        if (options.where.domainId === undefined && Object.prototype.hasOwnProperty.call(options.where, 'domainId'))
            options.where.domainId = null;

        return options;
    }
    
    /**
     * Gets a list of translations.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{LanguageList}}
     */
    static async getList(options) {
        return conf.global.models.Translation.findAll(await TranslationService.getListOptions(options));
    }

    static async _gt(language, texts, domain, isJson) {
        if (!texts?.length)
            return {};

        const translatations = {};
        for (let text of texts) {
            if (typeof text === 'function')
                return text();

            if (!language)
                return text;

            isJson ??= false;
            if (text instanceof Array) {
                isJson = true;
                text = JSON.stringify(text);
            }

            domain ??= null;
            
            text = text.trim();
            let translationObject = await conf.global.models.TranslationCache.findOne({where: {language, domain, source: text, isJson}});
            if (!translationObject) {
                const bestTranslation = await this.getBestMatchForLanguageTextIsJsonAndDomains(language, text, isJson, domain);
                if (bestTranslation) {
                    const source = await SourceService.getForTextAndIsJson(text, isJson);
                    translationObject = await conf.global.models.TranslationCache.create({language, domain, source: text, isJson, translation: bestTranslation, ref: source.ref});
                }
            }

            let translation;
            if (translationObject.isJson)
                translation = JSON.parse(translationObject.translation);
            else
                translation = translationObject.translation;

            translatations[text] = translation;
        }
        
        return translatations;
    }

    static async getBestMatchForLanguageTextIsJsonAndDomains(language, text, isJson, domains) {
        if (!language)
            return text;

        const sourceId = await SourceService.getIdOrCreateForTextAndIsJson(text, isJson);
        const domainsId = [];
        if (domains) {
            if (!(domains instanceof Array))
                domains = domains.split(',');
            
            let useNoDomain = true;
            await Promise.all(
                await domains.map(
                    async domain => {
                        if (domain)
                            domainsId.push(await DomainService.getIdOrCreateForName(domain.trim()));
                        else
                            useNoDomain = true;
                    }
                )
            );

            if (useNoDomain || !domainsId.length)
                domainsId.push(null);
        } else 
            domainsId.push(null);
        
        language = await LanguageService.createIfNotExists({name: language.trim(), title: language.trim()});
        while (language.id) {
            const data = {
                sourceId,
                languageId: language.id,
            };

            let translation;
            for (const i in domainsId) {
                const options = {
                    where: {...data,  domainId: domainsId[i]},
                    limit: 1
                };
                translation = await conf.global.models.Translation.findAll(options);

                if (translation.length) {
                    if (translation[0].text)
                        return translation[0].text;
                }
            }

            if (!language.parentId) 
                break;

            language = await LanguageService.get(language.parentId);
        }

        return text;
    }

    /**
     * Gets a translation for its language, source, and domain. For many coincidences and for no rows this method fails.
     * @param {string} language - language for the translation to get.
     * @param {string} source - source for the translation to get.
     * @param {string} domain - domain for the translation to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{Language}}
     */
    static async getForLanguageSourceAndDomain(language, source, domain, options) {
        return this.getList(deepComplete(options, {where:{language, source, domain: domain ?? null}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['translation', 'source', source, 'translation']})));
    }
    
    /**
     * Creates a new tranlaion row into DB if not exists.
     * @param {data} data - data for the new Language @see create.
     * @returns {Promise{Language}}
     */
    static async createIfNotExists(data, options) {
        await this.completeSourceId(data);
        await this.completeLanguageId(data);
        await this.completeDomainId(data);

        this.getList(deepComplete(options, {where:{languageId: data.languageId, sourceId: data.sourceId, domainId: data.domainId}, limit: 1}))
            .then(result => {
                if (result.length)
                    return result[0];

                data.text = data.translation;

                return this.create(data);
            });
    }
}