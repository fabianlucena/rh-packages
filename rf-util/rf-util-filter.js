import { defaultLoc } from 'rf-locale';
import { ucfirst } from './rf-util-string.js';

export async function sanitizeFields(items, options) {
  const filtered = [],
    filter = options?.filter,
    interfaceName = options?.interface,
    loc = options?.loc ?? defaultLoc,
    translationContext = options.translationContext;
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
      for (const dst of substitutions) {
        const src = interfaceName + ucfirst(dst);
        if (item[src] === undefined) {
          continue;
        }

        item[dst] = item[src];
        delete item[src];
      }
    }
    
    for (const t of ['label', 'title', 'placeholder', 'legend']) {
      if (typeof item[t] === 'function') {
        item[t] = await item[t](loc, translationContext);
      }
    }

    if (item.fields) {
      item.fields = await sanitizeFields(item.fields, options);
    }

    filtered.push(item);
  }

  return filtered;
}