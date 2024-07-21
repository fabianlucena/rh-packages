import { Service } from 'rf-service';

export class PerspectiveService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  references = {
    permission: true,
    menuItems: {
      service: 'perspectiveMenuItem',
      reverse: true,
    },
  };
  defaultTranslationContext = 'perspective';
  viewAttributes = ['id', 'uuid', 'isEnabled', 'name', 'title', 'description'];
  
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
        placeholder: loc => loc._c('perspective', 'Check for enable and uncheck for disable'),
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
}