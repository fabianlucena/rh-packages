import {PageFormatService} from './page_format.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnabledModuleSharedTranslatable} from 'rf-service';
import {completeIncludeOptions, checkViewOptions} from 'sql-util';
import {checkParameterStringNotNullOrEmpty, loc} from 'rf-util';

export class PageService extends ServiceIdUuidNameTitleEnabledModuleSharedTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Page;
    shareObject = 'Page';
    shareService = conf.global.services.Share.singleton();
    references = {
        format: {
            service: conf.global.services.PageFormat,
            otherName: 'pageFormat',
        },
        language: conf.global.services.Language,
    };
    defaultTranslationContext = 'page';
    skipNoOwnerCheck = true;

    constructor() {
        super();
        this.pageFormatService = PageFormatService.singleton();
    }

    async validateForCreation(data) {
        checkParameterStringNotNullOrEmpty(data.content, loc._cf('page', 'Content'));
        if (!data.formatId) {
            data.formatId = await this.pageFormatService.getIdForName('plain');
        }

        return super.validateForCreation(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'name', 'isTranslatable', 'translationContext', 'title', 'content'];
            }

            completeIncludeOptions(
                options,
                'Format',
                {
                    model: conf.global.models.PageFormat,
                    as: 'Format',
                    attributes: ['name'],
                }
            );

            await checkViewOptions(options);
        }

        return super.getListOptions(options);
    }
}