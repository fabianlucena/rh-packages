import { Service } from 'rf-service';

export class PerspectiveMenuItemService extends Service.IdUuidEnableOwnerModuleTranslatable {
  references = {
    perspective: true,
    menuItem:    { whereColumn: 'name' },
  };
  uniqueColumns = [ 'perspectiveId', 'menuItemId' ];
  defaultTranslationContext = 'perspective';
  viewAttributes = ['id', 'uuid', 'isEnabled'];
  
  async getInterface(options) {
    const gridActions = [],
      permissions = options?.context?.req?.permissions;
    if (permissions.includes('perspective.create')) gridActions.push('create');
    if (permissions.includes('perspective.edit'))   gridActions.push('enableDisable', 'edit');
    if (permissions.includes('perspective.delete')) gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const fields = [
      {
        name:            'perspective.uuid',
        gridName:        'perspective.title',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('perspective', 'Perspective'),
        placeholder:     loc => loc._c('perspective', 'Select the perspective'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'perspective-menu-item/perspective',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:            'menuItem.uuid',
        gridName:        'menuItem.name',
        type:            'select',
        gridType:        'text',
        label:           loc => loc._c('perspective', 'Menu item'),
        placeholder:     loc => loc._c('perspective', 'Select the menu item'),
        isField:         true,
        isColumn:        true,
        loadOptionsFrom: {
          service: 'perspective-menu-item/menu-item',
          value:   'uuid',
          text:    'name',
        },
      },
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('perspective', 'Enabled'),
        placeholder: loc => loc._c('perspective', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'optionsReplacementsJson',
        type:        'textArea',
        label:       loc => loc._c('perspective', 'Options replacements'),
        placeholder: loc => loc._c('perspective', 'Type the options replacements here in JSON format'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title:     loc => loc._c('perspective', 'Perspective menu item'),
      gridTitle: loc => loc._c('perspective', 'Perspectives menu items'),
      load: {
        service: 'perspective-menu-item',
        method:  'get',
      },
      getDefaultValues: false,
      action: 'perspective-menu-item',
      gridActions,
      fields,
    };

    return result;
  }
}