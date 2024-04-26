import { conf } from '../conf.js';
import { ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable } from 'rf-service';

export class WfWorkflowService extends ServiceIdUuidNameTitleDescriptionEnabledOwnerModuleTranslatable {
  references = {
    modelEntityName: {
      createIfNotExists: true,
      attributes: ['uuid', 'name'],
      whereColumn: 'name',
    },
    workflowType:    'wfWorkflowTypeService',
  };
  defaultTranslationContext = 'workflow';
  translatableColumns = [
    'title',
    'description',
    'currentStatusTitle',
    'assigneeTitle',
    'workflowTitle',
  ];

  constructor() {
    if (!conf.global.services.ModelEntityName?.singleton) {
      throw new Error('There is no ModelEntityName service. Try adding RH Model Entity Name module to the project.');
    }

    super();
  }

  async getListOptions(options) {
    options = { ...options };

    if (options.include?.ModelEntityName
      || options.where?.modelEntityName
    ) {
      if (options.include?.ModelEntityName) {
        if (options.include.ModelEntityName === true) {
          options.include.ModelEntityName = {};
        }

        if (!options.include.ModelEntityName.attributes) {
          options.include.ModelEntityName.attributes = ['uuid', 'name'];
        }
      } else {
        options.include ??= {};
        options.include.ModelEntityName = {};
      }

      if (options.isEnabled !== undefined) {
        options.include.ModelEntityName.where = {
          isEnabled: options.isEnabled,
          ...options.include.ModelEntityName.where,
        };
      }

      if (options.where?.modelEntityName) {
        options.include.ModelEntityName.where = {
          isEnabled: options.isEnabled,
          ...options.where.modelEntityName,
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