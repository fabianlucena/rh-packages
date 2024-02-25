import {loc} from 'rf-util';

export const data = {
    eavAttributesTypes: [
        {name: 'text',   title: loc._cf('eav', 'Text'),   description: loc._cf('eav', 'The value is a free text.'), isTranslatable: true},
        {name: 'select', title: loc._cf('eav', 'Select'), description: loc._cf('eav', 'The value must be select from a set of options.'), isTranslatable: true},
    ]
};
