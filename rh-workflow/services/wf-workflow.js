import { Service } from 'rf-service';

export class WfWorkflowService extends Service.IdUuidEnableNameUniqueTitleOwnerModuleDescriptionTranslatable {
  references = {
    modelEntityName: {
      createIfNotExists: true,
      attributes: ['uuid', 'name'],
      whereColumn: 'name',
    },
    type: 'wfTypeService',
  };
  defaultTranslationContext = 'workflow';
  translatableColumns = [
    'title',
    'description',
    'currentStatusTitle',
    'assigneeTitle',
    'workflowTitle',
  ];

  async getListOptions(options) {
    options = { ...options };

    if (options.include?.modelEntityName
      || options.where?.modelEntityName
    ) {
      if (options.include?.modelEntityName) {
        if (options.include.modelEntityName === true) {
          options.include.modelEntityName = {};
        }

        if (!options.include.modelEntityName.attributes) {
          options.include.modelEntityName.attributes = ['uuid', 'name'];
        }
      } else {
        options.include ??= {};
        options.include.modelEntityName = {};
      }

      if (options.isEnabled !== undefined) {
        options.include.modelEntityName.where = {
          isEnabled: options.isEnabled,
          ...options.include.modelEntityName.where,
        };
      }

      if (options.where?.modelEntityName) {
        options.include.modelEntityName.where = {
          ...options.where.modelEntityName,
          ...options.include.modelEntityName.where,
        };
        delete options.where?.modelEntityName;
      }
    }
        
    return super.getListOptions(options);
  }

  async getForEntityName(entityName, options) {
    return this.getFor({ modelEntityName: { name: entityName }}, options);
  }
}