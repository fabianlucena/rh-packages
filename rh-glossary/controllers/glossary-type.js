import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class GlossaryTypeController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('glossaryTypeService');
    this.glossaryService = dependency.get('glossaryService');
  }

  postPermission =               'glossary.edit';
  getPermission =                'glossary.edit';
  deleteForUuidPermission =      'glossary.edit';
  postEnableForUuidPermission =  'glossary.edit';
  postDisableForUuidPermission = 'glossary.edit';
  patchForUuidPermission =       'glossary.edit';

  async getInterface() {
    const gridActions = [];
    gridActions.push('create');
    gridActions.push('enableDisable', 'edit');
    gridActions.push('delete');
    gridActions.push('search', 'paginate');
    
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       loc => loc._c('glossary', 'Enabled'),
        placeholder: loc => loc._c('glossary', 'Check for enable or uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       loc => loc._c('glossary', 'Title'),
        placeholder: loc => loc._c('glossary', 'Type the title here'),
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
        label:       loc => loc._c('glossary', 'Name'),
        placeholder: loc => loc._c('glossary', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'glossary.uuid',
        gridName:    'glossary.title',
        type:        'select',
        gridType:    'text',
        label:       loc => loc._c('glossary', 'Glossary'),
        placeholder: loc => loc._c('glossary', 'Select the glossary'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary-type/glossary',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       loc => loc._c('glossary', 'Description'),
        placeholder: loc => loc._c('glossary', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: loc => loc._c('glossary', 'Type for glossary'),
      gridTitle: loc => loc._c('glossary', 'Types for glossaries'),
      load: {
        service: 'glossary-type',
        method:  'get',
      },
      action: 'glossary-type',
      gridActions,
      fields,
    };

    return result;
  }

  'getPermission /glossary' = [ 'glossary.create', 'glossary.edit' ];
  async 'get /glossary'(req) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    let result = await this.glossaryService.getListAndCount(options);
    result = await this.glossaryService.sanitize(result);

    return result;
  }
}