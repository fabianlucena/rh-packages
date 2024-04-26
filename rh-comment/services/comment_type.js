import { conf } from '../conf.js';
import { runSequentially } from 'rf-util';
import { ServiceIdUuidNameTitleDescriptionEnabledTranslatable } from 'rf-service';

export class CommentTypeService extends ServiceIdUuidNameTitleDescriptionEnabledTranslatable {
  references = {
    modelEntityName: {
      createIfNotExists: true,
      attributes: ['uuid', 'name'],
      whereColumn: 'name',
    },
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

  async getForEntityName(entityName, options) {
    return this.getFor({ modelEntityName: { name: entityName }}, options);
  }
}