import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class GlossaryCategoryController extends Controller {
  constructor() {
    super();

    this.service =         dependency.get('glossaryCategoryService');
    this.glossaryService = dependency.get('glossaryService');
  }

  postPermission =               'glossary.edit';
  getPermission =                'glossary.edit';
  deleteForUuidPermission =      'glossary.edit';
  postEnableForUuidPermission =  'glossary.edit';
  postDisableForUuidPermission = 'glossary.edit';
  patchForUuidPermission =       'glossary.edit';

  async getFields(req) {
    const gridActions = [];
    gridActions.push('create');
    gridActions.push('enableDisable', 'edit');
    gridActions.push('delete');
    gridActions.push('search', 'paginate');
        
    const loc = req.loc ?? defaultLoc;
    const fields = [
      {
        name:        'isEnabled',
        type:        'checkbox',
        label:       await loc._c('glossary', 'Enabled'),
        placeholder: await loc._c('glossary', 'Check for enable and uncheck for disable'),
        value:       true,
        isField:     true,
      },
      {
        name:        'title',
        type:        'text',
        label:       await loc._c('glossary', 'Title'),
        placeholder: await loc._c('glossary', 'Type the title here'),
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
        label:       await loc._c('glossary', 'Name'),
        placeholder: await loc._c('glossary', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        alias:       'glossary',
        name:        'glossary.uuid',
        gridName:    'glossary.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('glossary', 'Glossary'),
        placeholder: await loc._c('glossary', 'Select the glossary'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary-category/glossary',
          value:   'uuid',
          text:    'title',
          title:   'description',
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       await loc._c('glossary', 'Description'),
        placeholder: await loc._c('glossary', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: await loc._c('glossary', 'Category for glossary'),
      gridTitle: await loc._c('glossary', 'Categories for glossaries'),
      load: {
        service: 'glossary-category',
        method:  'get',
      },
      action: 'glossary-category',
      gridActions,
      fields,
    };

    return result;
  }

  'getPermission /glossary' = [ 'glossary.create', 'glossary.edit' ];
  async 'get /glossary'(req, res) {
    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);

    const result = await this.glossaryService.getListAndCount(options);

    res.status(200).send(result);
  }
}