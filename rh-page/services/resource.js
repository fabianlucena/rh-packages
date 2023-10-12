import {ResourceTypeService} from './resource_type.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameEnableTranslatable} from 'rf-service';
import {addEnabledFilter, completeIncludeOptions, checkViewOptions} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull, checkNotNullNotEmptyAndNotUndefined} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class ResourceService extends ServiceIdUuidNameEnableTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Resource;
    shareObject = 'Resource';
    shareService = conf.global.services.Share;
    references = {
        type: {
            service: conf.global.services.ResourceType,
            otherName: 'resourceType',
        },
        language: conf.global.services.Language,
    };
    defaultTranslationContext = 'resource';

    constructor() {
        super();
        this.resourceTypeService = ResourceTypeService.singleton();
    }

    async validateForCreation(data) {
        if (data.id) {
            throw new CheckError(loc._cf('resource', 'ID parameter is forbidden for creation.'));
        }

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('resource', 'Name'));
        if (await this.getForName(data.name, {skipNoRowsError: true})) {
            throw new ConflictError(loc._cf('resource', 'Exists another resource with that name.'));
        }

        if (data.title) {
            checkParameterStringNotNullOrEmpty(data.title, loc._cf('resource', 'Title'));
        }

        checkNotNullNotEmptyAndNotUndefined(data.content, loc._cf('resource', 'Content'));

        checkValidUuidOrNull(data.uuid);

        if (!data.typeId) {
            data.typeId = await this.resourceTypeService.getIdForName('raw');
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
        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
        }

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'name', 'title', 'content'];
            }

            completeIncludeOptions(
                options,
                'Type',
                {
                    model: conf.global.models.ResourceType,
                    as: 'Type',
                    attributes: ['name'],
                }
            );

            checkViewOptions(options);
        }

        return options;
    }
}