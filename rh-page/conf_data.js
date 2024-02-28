import {loc} from 'rf-locale';

const name = 'rhPage';

export const data = {
    pageFormats: [
        {name: 'plain', title: loc._cf('pageFormat', 'Plain'),  isTranslatable: true, ownerModule: name},
        {name: 'html',  title: loc._cf('pageFormat', 'Format'), isTranslatable: true, ownerModule: name},
    ],
    
    resourceTypes: [
        {name: 'image/png',     title: loc._cf('resourceType', 'PNG image'), isTranslatable: true, ownerModule: name},
        {name: 'image/svg+xml', title: loc._cf('resourceType', 'SVG image'), isTranslatable: true, ownerModule: name},
    ],
};
