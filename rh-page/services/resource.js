import {ResourceTypeService} from './resource_type.js';
import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions, checkViewOptions} from 'sql-util';
import {checkNotNullNotEmptyAndNotUndefined, loc} from 'rf-util';

export class ResourceService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Resource;
    shareObject = 'Resource';
    shareService = conf.global.services.Share.singleton();
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
        checkNotNullNotEmptyAndNotUndefined(data.content, loc._cf('resource', 'Content'));
        if (!data.typeId) {
            data.typeId = await this.resourceTypeService.getIdForName('raw');
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

        return super.getListOptions(options);
    }
}