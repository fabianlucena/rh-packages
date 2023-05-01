'use strict';

import {conf} from '../conf.js';
import {SourceService} from './source.js';
import {LanguageService} from './language.js';
import {DomainService} from './domain.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {deepComplete} from 'rf-util';

export class TranslationService {
    /**
     * Complete the data object with the sourceId property if not exists. 
     * @param {{source: string, sourceId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeSourceId(data) {
        if (!data.sourceId)
            if (!data.source)
                throw new MissingPropertyError('Translation', 'source', 'sourceId');
            else
                data.sourceId = await conf.global.services.Source.getIdOrCreateForText(data.source, {data: data.isJson});

        return data;
    }

    /**
     * Complete the data object with the languageId property if not exists. 
     * @param {{language: string, languageId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeLanguageId(data) {
        if (!data.languageId)
            if (!data.language)
                throw new MissingPropertyError('Translation', 'language', 'languageId');
            else
                data.languageId = await conf.global.services.Language.getIdForName(data.language);

        return data;
    }

    /**
     * Complete the data object with the domainId property if not exists. 
     * @param {{domain: string, domainId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeDomainId(data) {
        if (!data.domainId)
            if (!data.domain)
                data.domainId = null;
            else
                data.domainId = await conf.global.services.Domain.getIdForName(data.domain);

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

        if (!data.sourceId)
            throw new MissingPropertyError('Translation', 'sourceId');

        if (!data.languageId)
            throw new MissingPropertyError('Translation', 'languageId');

        return conf.global.models.Translation.create(data);
    }
    
    /**
     * Gets a list of translations.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{LanguageList}}
     */
    static async getList(options) {
        await this.completeSourceId(options.where);
        await this.completeLanguageId(options.where);
        await this.completeDomainId(options.where);

        delete options.where.source;
        delete options.where.language;
        delete options.where.domain;

        return conf.global.models.Translation.findAll(options);
    }

    static async _gt(language, text, domain) {
        if (!language)
            return text;
        
        let translation = await conf.global.models.TranslationCache.findOne({where: {language, domain, source: text}});
        if (translation)
            return translation.translation;
            
        translation = await this.getBestMatchForLanguageTextAndDomains(language, text, domain);
        if (translation)
            await conf.global.models.TranslationCache.create({language, domain, source: text, translation});
        
        return translation;
    }

    static async getBestMatchForLanguageTextAndDomains(language, text, domains) {
        if (!language)
            return text;

        const sourceId = await SourceService.getIdOrCreateForText(text.trim());
        const domainsId = [];
        if (domains) {
            if (!(domains instanceof Array))
                domains = domains.split(',');
            
            let useNoDomain = true;
            await Promise.all(
                domains.map(
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