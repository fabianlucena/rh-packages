import { Service } from 'rf-service';
import { defaultLoc } from 'rf-locale';

export class EavAttributeTypeService extends Service.IdUuidEnableNameUniqueTitleDescriptionTranslatable {
  defaultTranslationContext = 'eav';
  viewAttributes = ['uuid', 'isEnabled', 'name', 'title', 'isTranslatable', 'description'];

  async getInterface({ loc }) {
    const gridActions = ['search', 'paginate'];
        
    loc ??= defaultLoc;
    const fields = [
      {
        name:        'title',
        type:        'text',
        label:       await loc._c('eav', 'Title'),
        placeholder: await loc._c('eav', 'Type the title here'),
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
        label:       await loc._c('eav', 'Name'),
        placeholder: await loc._c('eav', 'Type the name here'),
        isField:     true,
        isColumn:    true,
        required:    true,
        disabled: {
          create:      false,
          defaultValue: true,
        },
      },
      {
        name:        'description',
        type:        'textArea',
        label:       await loc._c('eav', 'Description'),
        placeholder: await loc._c('eav', 'Type the description here'),
        isField:     true,
        isDetail:    true,
      },
    ];

    const result = {
      title: await loc._c('eav', 'Attributes types'),
      load: {
        service: 'attribute-type',
        method: 'get',
      },
      action: 'attribute-type',
      gridActions,
      fields,
    };

    return result;
  }
}