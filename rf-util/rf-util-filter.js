import { defaultLoc } from 'rf-locale';
import { ucfirst } from './rf-util-string.js';

export async function sanitizeFields(rawFields, options) {
  const sanitizedFields = [],
    filter = options?.filter,
    interfaceName = options?.interface,
    loc = options?.loc ?? defaultLoc,
    translationContext = options?.translationContext;
  for (let field of rawFields) {
    let hideValue = filter?.hide?.[field.name];
    if (typeof hideValue === 'function') {
      hideValue = await hideValue(options);
    }
        
    if (hideValue) {
      continue;
    }

    field = { ...field };

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
        if (field[src] === undefined) {
          continue;
        }

        field[dst] = field[src];
        delete field[src];
      }
    }
    
    for (const t of ['label', 'title', 'placeholder', 'legend']) {
      if (typeof field[t] === 'function') {
        field[t] = await field[t](loc, translationContext);
      }
    }

    if (field.fields) {
      field.fields = await sanitizeFields(field.fields, options);
    }

    sanitizedFields.push(field);
  }

  return sanitizedFields;
}