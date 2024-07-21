import { loc } from 'rf-locale';

const name = 'rhProjectSelect';

export const data = {
  permissions: [
    {
      name:               'project-select.switch',
      title:              loc._cf('projectSelect', 'Select project'),
      isTranslatable:     true,
      translationContext: 'projectSelect',
      ownerModule:        name,
      menuItem:           {
        title:              loc._cf('projectSelect', 'Select project'),
        isTranslatable:     true,
        translationContext: 'projectSelect',
        icon:               'project-select-switch',
        action:             'object',
        service:            'project-select',
        toolbarIcon:        'project-select-switch',
      },
    },
  ],
};
