import { CommentTypeService } from './comment_type.js';
import { conf } from '../conf.js';
import { ServiceIdUuid } from 'rf-service';
import { completeIncludeOptions } from 'sql-util';

export class CommentService extends ServiceIdUuid {
  sequelize = conf.global.sequelize;
  model = conf.global.models.Comment;
  references = {
    modelEntityName: conf?.global?.services?.ModelEntityName?.singleton(),
    commentType: CommentTypeService.singleton(),
  };

  constructor() {
    if (!conf?.global?.services?.ModelEntityName?.singleton) {
      throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
    }

    super();
  }

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
        where = { isEnabled: options.isEnabled };
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