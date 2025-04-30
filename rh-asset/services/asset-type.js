import { Service, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { ConflictError } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';

export class AssetTypeService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    project: true,
  };
  defaultTranslationContext = 'asset';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];

  init() {
    super.init();

    this.service =        dependency.get('assetTypeService');
    this.assetService =   dependency.get('assetService');
    this.projectService = dependency.get('projectService');
  }

  async delete(options) {
    options = { ...options };
    options.where = await this.completeReferences(options.where);

    const existingAssets = await this.assetService.getList({ attributes: ['id'], where: { type: options.where }, limit: 1 });
    if (existingAssets.length > 0) {
      throw new CheckError(loc => loc._c('asset', 'There are existing assets for the asset type.'));
    }
    return super.delete(options);
  }

  async getInterface({ loc, permissions }) {
    const gridActions = [];
    if (permissions.includes('assetType.create')) gridActions.push('create');
    if (permissions.includes('assetType.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions.includes('assetType.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    loc ??= defaultLoc;
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       await loc._c('asset', 'Enabled'),
        placeholder: await loc._c('asset', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       await loc._c('asset', 'Title'),
        placeholder: await loc._c('asset', 'Type the title here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        onValueChanged: {
          mode: {
            create:       true,
            defaultValue: false,
          },
          action:   'setValues',
          override: false,
          map: {
            name: {
              source:   'title',
              sanitize: 'dasherize',
            },
          },
        },
      },
      {
        name:       'name',
        type:       'text',
        label:       await loc._c('asset', 'Name'),
        placeholder: await loc._c('asset', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'project.uuid',
        gridName:    'project.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('asset', 'Project'),
        placeholder: await loc._c('asset', 'Select the project'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'asset-type/project',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       await loc._c('asset', 'Description'),
        placeholder: await loc._c('asset', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: await loc._c('asset', 'Assets types'),
      load: {
        service: 'asset-type',
        method: 'get',
      },
      action: 'asset-type',
      gridActions,
      fields,
    };

    return result;
  }

  async validateForCreation(data) {
    if (!data?.projectId) {
      throw new CheckError(loc => loc._c('asset', 'Project parameter is missing.'));
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const rows = await this.getFor({ name, projectId: data.projectId }, { skipNoRowsError: true });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('asset', 'Exists another asset with that name in this project.'));
    }
  }

  async checkTitleForConflict(title, data, where) {
    const whereOptions = { title };
    const projectId = where?.projectId ?? data?.projectId;
    if (projectId) {
      whereOptions.projectId = projectId;
    }

    if (where?.uuid) {
      whereOptions.uuid = { [Op.ne]: where.uuid };
    }

    const rows = await this.getFor(whereOptions, { limit: 1 });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('asset', 'Exists another asset with that title in this project.'));
    }
  }
}