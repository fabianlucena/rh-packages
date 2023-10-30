import {PageFormatService} from './page_format.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameTitleEnableModuleTranslatable} from 'rf-service';
import {completeIncludeOptions, checkViewOptions} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class PageService extends ServiceIdUuidNameTitleEnableModuleTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Page;
    shareObject = 'Page';
    shareService = conf.global.services.Share;
    references = {
        format: {
            service: conf.global.services.PageFormat,
            otherName: 'pageFormat',
        },
        language: conf.global.services.Language,
    };
    defaultTranslationContext = 'page';

    constructor() {
        super();
        this.pageFormatService = PageFormatService.singleton();
    }

    async validateForCreation(data) {
        if (data.id) {
            throw new CheckError(loc._cf('page', 'ID parameter is forbidden for creation.'));
        }

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('page', 'Name'));
        if (await this.getForName(data.name, {skipNoRowsError: true})) {
            throw new ConflictError(loc._cf('page', 'Exists another page with that name.'));
        }

        checkParameterStringNotNullOrEmpty(data.title, loc._cf('page', 'Title'));
        checkParameterStringNotNullOrEmpty(data.content, loc._cf('page', 'Content'));

        checkValidUuidOrNull(data.uuid);

        if (!data.formatId) {
            data.formatId = await this.pageFormatService.getIdForName('plain');
        }

        return true;
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

            checkViewOptions(options);
        }

        return super.getListOptions(options);
    }
}