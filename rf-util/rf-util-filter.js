'use strict';

export async function filterVisualItemsByAliasName(items, filter, options) {
    const loc = options?.loc;

    const filtered = [];
    for (const item of items) {
        let hideValue = filter?.hide?.[item.alias ?? item.name];
        if (typeof hideValue === 'function')
            hideValue = await hideValue(options);
        
        if (hideValue)
            continue;
            
        if (loc) {
            if (item.label)       item.label =       await loc._(item.label);
            if (item.title)       item.title =       await loc._(item.title);
            if (item.placeholder) item.placeholder = await loc._(item.placeholder);
        }

        filtered.push(item);
    }

    return filtered;
}