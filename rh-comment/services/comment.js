import {CommentEntityTypeService} from './entity_type.js';
import {CommentTypeService} from './comment_type.js';
import {conf} from '../conf.js';
import {ServiceIdUuid} from 'rf-service';
import {completeIncludeOptions} from 'sql-util';

export class CommentService extends ServiceIdUuid {
    sequelize = conf.global.sequelize;
    model = conf.global.models.Comment;
    references = {
        entityType: CommentEntityTypeService.singleton(),
        commentType: CommentTypeService.singleton(),
    };

    async getListOptions(options) {
        options ??= {};

        if (options.view) {
            if (!options.attributes) {
                options.attributes = ['id', 'uuid', 'comment', 'createdAt'];
            }
        }

        if ((options.includeUser ?? options.view) || 
            options.where?.userUuid !== undefined
        ) {
            let where;

            if (options.isEnabled !== undefined) {
                where = {isEnabled: options.isEnabled};
            }

            if (options.where?.userUuid !== undefined) {
                where ??= {};
                where.uuid = options.where.userUuid;
                delete options.where.userUuid;
            }

            const attributes = options.includeUser?.attributes ??
                (options.includeUser ?? options.view)?
                ['uuid', 'username', 'displayName']:
                [];

            completeIncludeOptions(
                options,
                'User',
                {
                    model: conf.global.models.User,
                    attributes,
                    where,
                }
            );

            delete options.includeUser;
        }

        return super.getListOptions(options);
    }
}