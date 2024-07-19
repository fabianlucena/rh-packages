import { defaultLoc } from 'rf-locale';
import { ucfirst } from './rf-util-string.js';

export async function filterVisualItemsByAliasName(items, options) {
  const loc = options?.loc ?? defaultLoc;

  const filtered = [],
    filter = options?.filter,
    interfaceName = options?.interface;
  for (const item of items) {
    let hideValue = filter?.hide?.[item.name];
    if (typeof hideValue === 'function') {
      hideValue = await hideValue(options);
    }
        
    if (hideValue) {
      continue;
    }

    if (interfaceName) {
      const substitutions = [
        'label',
        'title',
        'placeholder',
        'type',
        'name',
      ];
      for (const dst in substitutions) {
        const src = interfaceName + ucfirst(dst);
        if (item[src] === undefined) {
          continue;
        }

        item[dst] = item[src];
        delete item[src];
      }
    }
            

    for (const t of ['label', 'title', 'placeholder']) {
      if (typeof item[t] === 'function') {
        item[t] = await item[t](loc, translationContext);
      }
    }

    filtered.push(item);
  }

  return filtered;
}