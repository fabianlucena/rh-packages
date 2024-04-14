import { conf } from '../conf.js';
import { runSequentially } from 'rf-util';
import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';
import { completeIncludeOptions } from 'sql-util';

export class CommentTypeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  sequelize = conf.global.sequelize;
  model = conf.global.models.CommentType;
  references = {
    modelEntityName: {
      service: conf?.global?.services?.ModelEntityName?.singleton(),
      createIfNotExists: true,
    }
  };

  constructor() {
    if (!conf?.global?.services?.ModelEntityName?.singleton) {
      throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
    }

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
      async data => await this.commentTypeOptionService.createIfNotExists({ attributeId, ...data })
    );

    return attribute;
  }

  async getListOptions(options) {
    options ||= {};

    if (options.includeModelEntityName || options.where?.modelEntityName) {
      let attributes = options.includeModelEntityName || [];
      if (attributes === true) {
        attributes = ['uuid', 'name'];
      }

      let where;
      if (options.isEnabled !== undefined) {
        where = { isEnabled: options.isEnabled };
      }

      if (options.where?.modelEntityName) {
        where = { ...where, ...options.where.modelEntityName };
        delete options.where?.modelEntityName;
      }

      completeIncludeOptions(
        options,
        'ModelEntityName',
        {
          model: conf.global.models.ModelEntityName,
          attributes,
          where,
        }
      );
    }
        
    return super.getListOptions(options);
  }

  async getForEntityName(entityName, options) {
    return this.getFor({ modelEntityName: { name: entityName }}, options);
  }
}