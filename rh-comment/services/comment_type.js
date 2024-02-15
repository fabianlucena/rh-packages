import {CommentEntityTypeService} from './entity_type.js';
import {conf} from '../conf.js';
import {runSequentially} from 'rf-util';
import {ServiceIdUuidNameTitleDescriptionEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class CommentTypeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.CommentType;
    references = {
        entityType: {
            service: CommentEntityTypeService.singleton(),
            createIfNotExists: true,
        }
    };

    constructor() {
        super();

        this.translatableColumns ??= [];
        this.translatableColumns.push('addTitle');
    }

    async checkTitleForConflict() {}

    async createOrUpdate(data) {
        const attribute = await this.createIfNotExists(data);
        const attributeId = attribute.id;
        await runSequentially(
            data.options,
            async data => await this.commentTypeOptionService.createIfNotExists({attributeId, ...data})
        );

        return attribute;
    }

    async getListOptions(options) {
        options ||= {};

        if (options.includeEntityType || options.where?.entityType) {
            let attributes = options.includeEntityType || [];
            if (attributes === true) {
                attributes = ['uuid', 'name'];
            }

            let where;
            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.entityType) {
                where = {...where, ...options.where.entityType};
                delete options.where?.entityType;
            }

            completeIncludeOptions(
                options,
                'CommentEntityType',
                {
                    model: conf.global.models.CommentEntityType,
                    attributes,
                    where,
                }
            );
        }
        
        return super.getListOptions(options);
    }

    async getForEntityName(entityName, options) {
        return this.getFor({entityType: {name: entityName}}, options);
    }
}