import { defaultLoc } from 'rf-locale';

export async function filterVisualItemsByAliasName(items, filter, options) {
  const loc = options?.loc ?? defaultLoc;

  const filtered = [];
  for (const item of items) {
    let hideValue = filter?.hide?.[item.alias ?? item.name];
    if (typeof hideValue === 'function') {
      hideValue = await hideValue(options);
    }
        
    if (hideValue) {
      continue;
    }

    for (const t of ['label', 'title', 'placeholder']) {
      if (typeof item[t] === 'function') {
        item[t] = await item[t](loc);
      }
    }

    filtered.push(item);
  }

  return filtered;
}