import { conf } from '../conf.js';
import { Service, Op } from 'rf-service';
import { CheckError } from 'rf-util';
import { ConflictError } from 'http-util';
import dependency from 'rf-dependency';
import { defaultLoc } from 'rf-locale';

export class AssetService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    project: true,
    type:    'assetType',
  };
  defaultTranslationContext = 'asset';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];
  eventBus = conf.global.eventBus;

  init() {
    super.init();

    this.service =          dependency.get('assetService');
    this.assetTypeService = dependency.get('assetTypeService');
  }

  async getInterface(req) {
    const gridActions = [];
    if (req.permissions.includes('asset.create')) gridActions.push('create');
    if (req.permissions.includes('asset.edit'))   gridActions.push('enableDisable', 'edit');
    if (req.permissions.includes('asset.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;
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
        name:            'type',
        gridName:        'type.title',
        type:            'select',
        gridType:        'text',
        label:           await loc._c('asset', 'Type'),
        placeholder:     await loc._c('asset', 'Select the type'),
        isField:         true,
        isColumn:        true,
        required:        true,
        valueProperty:   'uuid',
        loadOptionsFrom: {
          service: 'asset/type',
          text:    'title',
          title:   'description',
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
        loadOptionsFrom: {
          service: 'asset/project',
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
      title: await loc._c('asset', 'Assets'),
      load: {
        service: 'asset',
        method: 'get',
      },
      action: 'asset',
      getDefaultValues: true,
      gridActions,
      fields,
    };

    return result;
  }

  async validateForCreation(data) {
    if (!data?.typeId) {
      throw new CheckError(loc => loc._c('asset', 'Type parameter is missing.'));
    }

    if (!data.projectId) {
      const type = await this.assetTypeService.getSingleForId(data.typeId);
      data.projectId = type.projectId;
    }

    return super.validateForCreation(data);
  }

  async checkNameForConflict(name, data) {
    const rows = await this.getFor({ name, typeId: data.projectId }, { skipNoRowsError: true });
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