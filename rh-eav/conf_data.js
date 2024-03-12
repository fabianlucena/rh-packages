import {loc} from 'rf-locale';

export const data = {
    eavAttributesTypes: [
        {name: 'text',   title: loc._cf('eav', 'Text'),   description: loc._cf('eav', 'The value is a free text.'),                       isTranslatable: true, translationContext: 'eav'},
        {name: 'select', title: loc._cf('eav', 'Select'), description: loc._cf('eav', 'The value must be select from a set of options.'), isTranslatable: true, translationContext: 'eav'},
        {name: 'tags'  , title: loc._cf('eav', 'Tags'),   description: loc._cf('eav', 'The values are tags, free to add and select.'),    isTranslatable: true, translationContext: 'eav'},
    ],
};
