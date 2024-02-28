import {defaultLoc} from 'rf-locale';

export async function filterVisualItemsByAliasName(items, filter, options) {
    const loc = options?.loc ?? defaultLoc;
    const translationContext = options?.translationContext;

    const filtered = [];
    for (const item of items) {
        let hideValue = filter?.hide?.[item.alias ?? item.name];
        if (typeof hideValue === 'function') {
            hideValue = await hideValue(options);
        }
        
        if (hideValue) {
            continue;
        }
            
        if (loc) {
            const thisTranslationContext = item.translationContext ?? translationContext;
            if (item.label)       item.label =       await loc._c(thisTranslationContext, item.label);
            if (item.title)       item.title =       await loc._c(thisTranslationContext, item.title);
            if (item.placeholder) item.placeholder = await loc._c(thisTranslationContext, item.placeholder);
        }

        filtered.push(item);
    }

    return filtered;
}