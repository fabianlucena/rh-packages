'use strict';

import {conf} from '../conf.js';
import {SourceService} from './source.js';
import {LanguageService} from './language.js';
import {DomainService} from './domain.js';
import {MissingPropertyError} from 'sql-util';

export class TranslationService {
    /**
     * Creates a new translation row into DB.
     * @param {{sourceId: string, title: string, description: string}} data - data for the new domain.
     *  - name: must be unique.
     *  - title: must be unique.
     * @returns {Promise{Domain}}
     */
    static async create(data) {
        if (!data.sourceId)
            throw new MissingPropertyError('Translation', 'sourceId');

        if (!data.languageId)
            throw new MissingPropertyError('Translation', 'languageId');

        return conf.global.models.Domain.create(data);
    }
    
    static async _gt(language, text, domain) {
        if (!language)
            return text;
        
        let translation = await conf.global.models.TranslationCache.findOne({where: {language, domain, source: text}});
        if (translation)
            return translation.translation;
            
        translation = await this.getBestMatchForLanguageTextAndDomains(language, text, domain);
        if (translation)
            conf.global.models.TranslationCache.create({language, domain, source: text, translation});
        
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
}