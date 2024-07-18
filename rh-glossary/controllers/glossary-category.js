import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { getOptionsFromParamsAndOData } from 'http-util';
import { defaultLoc } from 'rf-locale';

export class GlossaryCategoryController extends Controller {
  postPermission =               'glossary.create';
  getPermission =                'glossary.get';
  deleteForUuidPermission =      'glossary.delete';
  postEnableForUuidPermission =  'glossary.edit';
  postDisableForUuidPermission = 'glossary.edit';
  patchForUuidPermission =       'glossary.edit';

  async getFields(req) {
    const gridActions = [];
    if (req.permissions.includes('glossary.create')) gridActions.push('create');
    if (req.permissions.includes('glossary.edit'))   gridActions.push('enableDisable', 'edit');
    if (req.permissions.includes('glossary.delete')) gridActions.push('delete');
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
        alias:       'project',
        name:        'project.uuid',
        gridName:    'project.title',
        type:        'select',
        gridType:    'text',
        label:       await loc._c('glossary', 'Project'),
        placeholder: await loc._c('glossary', 'Select the project'),
        isField:     true,
        isColumn:    true,
        required:    true,
        loadOptionsFrom: {
          service: 'glossary/project',
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
      title: await loc._c('glossary', 'Glossarys'),
      load: {
        service: 'glossary',
        method:  'get',
      },
      getDefaultValues: true,
      action: 'glossary',
      gridActions,
      fields,
      fieldsFilter: conf?.glossary,
    };

    return result;
  }

  async getDefault(req) {
    const row = {};

    if (this.projectService && this.getCurrentProject) {
      const project = await this.getCurrentProject(req);
      if (project) {
        row.project = { uuid: project.uuid };
      }
    };

    return {
      count: 1,
      rows: [ row ],
    };
  }

  'getPermission /project' = [ 'glossary.create', 'glossary.edit' ];
  async 'get /project'(req, res) {
    if (!this.projectService) {
      if (!res.headersSent) {
        res.status(404).send({ error: 'Not found.' });
      }
    }

    const loc = req.loc ?? defaultLoc;
    const definitions = { uuid: 'uuid', name: 'string' };
    let options = { view: true, limit: 10, offset: 0, loc };

    options = await getOptionsFromParamsAndOData({ ...req.query, ...req.params }, definitions, options);
    if (conf.filters?.getCurrentProjectId) {
      options.where ??= {};
      options.where.id = await conf.filters.getCurrentProjectId(req) ?? null;
    }

    const result = await this.projectService.getListAndCount(options);

    res.status(200).send(result);
  }
}