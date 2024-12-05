import { conf } from '../conf.js';
import { Service } from 'rf-service';
import { SourceService } from './source.js';
import { LanguageService } from './language.js';
import { ContextService } from './context.js';
import { DomainService } from './domain.js';
import { checkDataForMissingProperties, getSingle, MissingPropertyError } from 'sql-util';
import { deepComplete } from 'rf-util';

export class TranslationService extends Service.IdUuidEnable {
  references = {
    source: {
      createIfNotExists: true,
      function: this.completeSourceId,
    },
    language: true,
    domain: { createIfNotExists: true },
    context: { createIfNotExists: true },
  };

  async sanitizeText(text) {
    return text.trim().replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  }

  async unsanitizeText(text) {
    return text.trim().replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  }

  /**
   * Complete the data object with the sourceId property if not exists. 
   * @param {{source: string, sourceId: integer, ...}} data 
   * @returns {Promise{data}}
   */
  async completeSourceId(data) {
    if (!data.sourceId && typeof data.source !== 'undefined' && data.source !== null) {
      data.sourceId = await SourceService.singleton().getIdOrCreateForTextAndIsJson(data.source, data.isJson, { data: { ref: data.ref }});
    }

    return data;
  }

  async validateForCreation(data) {
    await checkDataForMissingProperties(data, 'Translation', 'sourceId', 'languageId');
    if (typeof data.text === 'undefined' || data.text === null) {
      throw new MissingPropertyError('Translation', 'text');
    }

    data.text = await this.sanitizeText(data.text);

    return super.validateForCreation(data);
  }

  /**
   * Gets the options for use in the getList and getListAndCount methods.
   * @param {Options} options - options for the @see sequelize.findAll method.
   *  - view: show visible properties.
   * @returns {options}
   */
  async getListOptions(options) {
    options = { ...options };
    options.where = await this.completeReferences(options.where);

    if (options.where.domainId === undefined && Object.prototype.hasOwnProperty.call(options.where, 'domainId')) {
      options.where.domainId = null;
    }

    if (options.where.contextId === undefined && Object.prototype.hasOwnProperty.call(options.where, 'contextId')) {
      options.where.contextId = null;
    }

    return options;
  }

  async _gt(language, texts, options) {
    if (!texts?.length) {
      return {};
    }

    const translations = {};
    if (!language) {
      for (const text of texts) {
        translations[text] = text;
      }

      return translations;
    }

    options ??= {};
    options.domain ??= null;
    options.context ??= null;
        
    for (const text of texts) {
      let translation;

      if (typeof text === 'function') {
        translation = text();
      } else {
        try {
          let arrangedText;
          options.isJson ??= false;
          if (Array.isArray(text)) {
            options.isJson = true;
            arrangedText = JSON.stringify(text);
          } else {
            arrangedText = text;
          }

          if (arrangedText === null || arrangedText === undefined) {
            translations[arrangedText] = arrangedText;
            continue;
          }
                    
          let translationObject = await conf.global.models.TranslationCache.findOne({ where: { language, context: options.context ?? null, domain: options.domain ?? null, source: arrangedText, isJson: options.isJson }});
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

          if (translationObject.isJson) {
            translation = JSON.parse(translationObject.translation);
          } else {
            translation = await this.unsanitizeText(translationObject.translation);
          }
        } catch(err) {
          conf.global.log.error(err);
          translations[text] = text;
        }
      }

      translations[text] = translation;
    }
        
    return translations;
  }

  async getBestMatchForLanguageTextIsJsonContextsAndDomains(language, text, isJson, contexts, domains) {
    if (!language) {
      return { translation: text, isTranslated: false, isDraft: true };
    }

    const sourceId = await SourceService.singleton().getIdOrCreateForTextAndIsJson(text, isJson);
    let contextsId = [];
    let domainsId = [];
        
    if (contexts) {
      if (!Array.isArray(contexts)) {
        contexts = contexts.split(',').map(t => t.trim());
      }
            
      contextsId = await ContextService.singleton().getIdOrCreateForName(contexts);
    }
    if (!contextsId.length || !contextsId.some(context => context === null)) {
      contextsId.push(null);
    }
    contextsId.push(undefined);

    if (domains) {
      if (!Array.isArray(domains)) {
        domains = domains.split(',').map(t => t.trim());
      }
            
      domainsId = await DomainService.singleton().getIdOrCreateForName(domains);
      if (!domainsId.length && domains.some(c => !c)) {
        domainsId.push(null);
      }
    }
    if (!domainsId.length || !domainsId.some(domain => domain === null)) {
      domainsId.push(null);
    }
    domainsId.push(undefined);
        
    let [ languageData ] = await LanguageService.singleton().findOrCreate({ name: language.trim(), title: language.trim() });
    while (languageData.id) {
      const data = {
        sourceId,
        languageId: languageData.id,
      };

      let translation;
      for (const domainId of domainsId) {
        for (const contextId of contextsId) {
          const options = {
            where: { ...data, contextId, domainId },
            limit: 1
          };
          if (options.where.contextId === undefined) {
            delete options.where.contextId;
          }
          if (options.where.domainId === undefined) {
            delete options.where.domainId;
          }

          translation = await conf.global.models.Translation.findAll(options);

          if (translation.length) {
            if (translation[0].text) {
              return {
                translation: translation[0].text, 
                isTranslated: true, 
                isDraft: translation[0].isDraft,
              };
            }
          }
        }
      }

      if (!languageData.parentId) {
        break;
      }

      languageData = await LanguageService.singleton().getSingleForId(languageData.parentId);
    }

    return { translation: text, isTranslated: false, isDraft: true };
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
    return this.getList(deepComplete(options, { where:{ language, source, domain: domain ?? null }, limit: 2 }))
      .then(rowList => getSingle(rowList, deepComplete(options, { params: ['translation', 'source', source, 'translation'] })));
  }
    
  /**
   * Creates a new translation row into DB if not exists.
   * @param {data} data - data for the new Language @see create.
   * @returns {Promise{Language}}
   */
  async createIfNotExists(data, options) {
    data = await this.completeReferences(data, options);

    const rows = await this.getList({ where: { languageId: data.languageId, sourceId: data.sourceId, domainId: data.domainId, contextId: data.contextId, ...options?.where }, limit: 1, ...options });
    if (rows.length) {
      return rows[0];
    }

    data.text = data.translation;

    return this.create(data);
  }
}