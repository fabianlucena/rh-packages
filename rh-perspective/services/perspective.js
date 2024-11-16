import { Service, DisabledRowError, NoRowError, CheckError } from 'rf-service';
import dependency from 'rf-dependency';

export class PerspectiveService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    permission: true,
    menuItems: {
      service: 'perspectiveMenuItem',
      extern: true,
    },
  };
  defaultTranslationContext = 'perspective';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description', 'isTranslatable', 'translationContext'];
  translatableColumns = [ 'title', 'description' ];

  init() {
    super.init();

    this.sessionDataService = dependency.get('sessionDataService');
  }
  
  async getInterface(options) {
    const gridActions = [],
      permissions = options?.context?.req?.permissions;
    if (permissions.includes('perspective.create')) gridActions.push('create');
    if (permissions.includes('perspective.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions.includes('perspective.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('perspective', 'Enabled'),
        placeholder: loc => loc._c('perspective', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       loc => loc._c('perspective', 'Title'),
        placeholder: loc => loc._c('perspective', 'Type the title here'),
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
        label:       loc => loc._c('perspective', 'Name'),
        placeholder: loc => loc._c('perspective', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:            'permission.uuid',
        gridName:        'permission.name',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('perspective', 'Permission'),
        placeholder:     loc => loc._c('perspective', 'Select the permission'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'perspective/permission',
          value:   'uuid',
          text:    'name',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       loc => loc._c('perspective', 'Description'),
        placeholder: loc => loc._c('perspective', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title:     loc => loc._c('perspective', 'Perspective'),
      gridTitle: loc => loc._c('perspective', 'Perspectives'),
      load: {
        service: 'perspective',
        method:  'get',
      },
      getDefaultValues: false,
      action: 'perspective',
      gridActions,
      fields,
    };

    return result;
  }

  async switchToName(name, options) {
    return this.switchTo({ name }, options);
  }

  async switchToUuid(uuid, options) {
    return this.switchTo({ uuid }, options);
  }

  async switchTo(where, options) {
    const context = options.context;
    if (!context) {
      throw new CheckError(loc => loc._c('perspective', 'No context to switch perspective.'));
    }

    if (!context.sessionId) {
      throw new CheckError(loc => loc._c('perspective', 'No sessionId to switch perspective.'));
    }

    options = {
      loc: context.loc,
      skipNoRowsError: true,
    };
    let perspective = await this.getSingleOrNullFor(where, options);
    if (!perspective) {
      throw new NoRowError(loc => loc._c('perspective', 'The selected perspective does not exist or you do not have permission to access it.'), 400);
    }

    if (!perspective.isEnabled) {
      throw new DisabledRowError(loc => loc._c('perspective', 'The selected perspective is disabled.'), 403);
    }

    const sessionId = context.sessionId;
    await this.sessionDataService.addData(sessionId, { perspective });

    options.log?.info(`Perspective switched to: ${perspective.title}.`, { sessionId, perspectiveName: perspective.name });

    return {
      count: 1,
      rows: perspective,
      api: {
        data: {
          perspectiveUuid: perspective.uuid,
        },
      },
    };
  }
}