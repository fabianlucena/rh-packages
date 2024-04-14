import { loc } from 'rf-locale';

const name = 'rhBranchSelect';

export const data = {
  permissions: [
    { name: 'branch-select.switch', title: loc._cf('permission', 'Select branch'), isTranslatable: true, ownerModule: name, menuItem: { title: loc._cf('menu', 'Select branch'), isTranslatable: true, action: 'object', service: 'branch-select', toolbarIcon: 'branch-select-switch' }},
  ],
};
