import {loc} from 'rf-locale';

export const data = {
    eavAttributesTypes: [
        {name: 'text',   title: loc._cf('eav', 'Text'),   description: loc._cf('eav', 'The value is a free text.'), isTranslatable: true},
        {name: 'option', title: loc._cf('eav', 'Option'), description: loc._cf('eav', 'The value must be select from a set of options.'), isTranslatable: true},
    ]
};