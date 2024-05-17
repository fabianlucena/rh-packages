import { MissingParameterError, CheckError } from './rf-util-error.js';
import { loc } from 'rf-locale';
import * as uuid from 'uuid';

export function checkParameter(value, params, ...freeParams) {
  if (typeof params === 'string') {
    const newParams = {};
    newParams[params] = params;
    params = newParams;
  }

  freeParams.forEach(p => params[p] = p);

  if (!value) {
    throw new MissingParameterError(...Object.values(params));
  }

  const missing = [];
  for (let name in params) {
    if (value[name] === undefined) {
      missing.push(name);
    }
  }

  if (missing.length) {
    throw new MissingParameterError(...missing);
  }

  return value;
}

export function checkNull(obj, errMsj) {
  if (obj) {
    throw errMsj;
  }
}

export function checkNotNull(obj, errMsj) {
  if (obj) {
    return obj;
  }

  throw errMsj;
}

export function check(value, options) {
  if (typeof options === 'string') {
    options = { message: options };
  }

  if (options.allowNull && value === null) {
    return value;
  }
    
  if (options.allowUndefined && value === undefined) {
    return value;
  }

  let result;
  if (options?.method) {
    result = options.method(value);
  } else {
    result = !!value;
  }

  if (result) {
    return value;
  }
    
  throw new CheckError(options);
}

function getCheckOptionsFromParams(options, moreOptions) {
  if (typeof options === 'string' || typeof options === 'function') {
    options = { paramTitle: options };
  }

  return { ...options, ...moreOptions };
}

export function checkNotNullNotEmptyAndNotUndefined(value, options) {
  options = {
    method: v => !!v,
    statusCode: 500,
    _message: [loc._f('"%s" is null or empty'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkUndefinedOrNotNullAndNotEmpty(value, options) {
  options = {
    method: v => v === undefined || !!v,
    statusCode: 500,
    _message: [loc._f('"%s" is null or empty'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkParameterNotNullOrEmpty(value, options) {
  options = getCheckOptionsFromParams(options);
  return checkUndefinedOrNotNullAndNotEmpty(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is undefined, null or empty'), options?.paramTitle ?? 'value'],
      ...options,
    }
  );
}

export function checkString(value, options) {
  options = {
    method: v => typeof v === 'string',
    statusCode: 500,
    _message: [loc._f('"%s" is not a string'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkParameterStringNotNullOrEmpty(value, options) {
  options = getCheckOptionsFromParams(options);
  return checkNotNullNotEmptyAndNotUndefined(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is missing, null, or empty.'), options?.paramTitle ?? 'value'],
      ...options,
    }
  ) && checkString(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is not a string.'), options?.paramTitle ?? 'value'],
      ...options,
    }
  ) ;
}

export function checkParameterStringUndefinedOrNotNullAndNotEmpty(value, options) {
  options = getCheckOptionsFromParams(options);
  return checkUndefinedOrNotNullAndNotEmpty(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is null or empty'), options?.paramTitle ?? 'value'],
      ...options,
    }
  ) && checkString(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is not a string'), options?.paramTitle ?? 'value'],
      ...options,
    }
  );
}

export function checkValidUuid(value, options) {
  options = {
    method: uuid.validate,
    statusCode: 500,
    _message: [loc._f('"%s" is not a valid UUID value'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkValidUuidOrUnefined(value, options) {
  if (value === undefined) {
    return value;
  }

  options = {
    method: uuid.validate,
    statusCode: 500,
    _message: [loc._f('"%s" is not a valid UUID value'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkValidUuidOrNull(value, options) {
  options = {
    method: v => !v || uuid.validate(v),
    statusCode: 500,
    _message: [loc._f('"%s" is not a valid UUID value'), options?.paramTitle ?? 'value'],
    ...options
  };

  return check(value, options);
}

export function checkParameterUuid(value, options) {
  options = getCheckOptionsFromParams(options);
  return checkValidUuid(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is not a valid UUID value'), options?.paramTitle ?? 'value'],
      ...options,
    }
  );
}

export function checkValidUuidList(value, options) {
  options = {
    method: uuidList => {
      for (const uuidItem of uuidList) {
        if (!uuid.validate(uuidItem)) {
          return false;
        }
      }

      return true;
    },
    statusCode: 500,
    _message: [loc._f('"%s" is not a valid UUID value'), options?.paramTitle ?? 'value'],
    ...options,
  };

  return check(value, options);
}

export function checkParameterUuidList(value, options) {
  if (!Array.isArray(value) && value) {
    value = value.split(',').map(value => value.trim());
  }

  options = getCheckOptionsFromParams(options);
  return checkValidUuidList(
    value,
    {
      statusCode: 400,
      _message: [loc._f('"%s" parameter is not a valid UUID list value'), options?.paramTitle ?? 'value'],
      ...options,
    }
  );
}