export class BaseError extends Error {
  static visibleProperties = ['message'];

  constructor(options) {
    super();

    let arranged = {};
    for (const name in options) {
      const value = options[name];
      if (name == 'message' || name == 'statusCode' || this.constructor?.noObjectValues?.includes(name)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          arranged = { ...arranged, ...value };
          continue;
        }
      }

      arranged[name] = value;
    }

    for (const k in arranged) {
      this[k] = arranged[k];
    }
  }
}

export class CheckError extends BaseError {
  static visibleProperties = ['message'];

  constructor(message, options, ...params) {
    super({
      message,
      options,
      params,
    });
  }
}

export class MissingParameterError extends BaseError {
  static noObjectValues = ['missingParameters'];
  static visibleProperties = ['message', 'title', 'missingParameters'];
  message = async loc => {
    const missingParameters = Promise.all(
      this.missingParameters.map(p => {
        if (typeof p === 'function') {
          return p(loc);
        } else {
          return p;
        }
      })
    );

    return loc._nn(
      this.missingParameters.length,
      'Missing parameters.',
      'Missing parameter: "%s".',
      'Missing parameters: "%s".',
      await loc._and(...await missingParameters),
    );
  };

  statusCode = 400;
  missingParameters = [];
    
  constructor(...missingParameters) {
    super({ missingParameters });
  }
}

export class MergeTypeError extends BaseError {
  static noObjectValues = ['dstType', 'srcType'];
  static visibleProperties = ['message'];
  message = loc => loc._(
    'Cannot merge into "%s" from "%s".',
    this.dstType,
    this.srcType,
  );

  constructor(dstType, srcType) {
    super({
      dstType,
      srcType,
    });
  }

  async getMessageParam(loc) {  // eslint-disable-line no-unused-vars
    return [this.dstType, this.srcType];
  }
}

export async function getErrorMessage(error, loc) {
  let message;
  if (error.getMessage) {
    message = await error.getMessage(loc);
  } else {
    message = error.message;
  }

  if (!message) {
    return error.toString();
  }

  if (typeof message === 'function') {
    message = await message(loc);
  }

  return message;
}

export async function getErrorData(error, loc, options) {
  let data = { error: null };
  if (error instanceof Error) {
    data.name = error.constructor.name;
    if (data.name[0] == '_') {
      data.name = data.name.substring(1);
    }

    const visibleProperties = options?.properties ?? error.constructor?.visibleProperties ?? ['message', 'title', 'length', 'fileName', 'lineNumber', 'columnNumber', 'redirectTo', 'stack'];
    visibleProperties.forEach(n => data[n] = error[n]);

    if (error.statusCode) {
      data.statusCode = error.statusCode;
    }

    data.message = await getErrorMessage(error, loc);
  } else {
    data.message = error;
  }

  if (typeof error.title === 'function') {
    data.title = await error.title(loc);
  }

  if (data.stack && typeof data.stack === 'string') {
    data.stack = data.stack.split('\n');
  }

  if (!data.error) {
    data.error = data.name || data.message || 'Error';
  }

  return data;
}

export async function errorHandler(error, loc, showInConsole) {
  const data = await getErrorData(error, loc);
  const logTitle = data.name? data.name + ': ': '';

  if (showInConsole || showInConsole === undefined) {
    console.error(logTitle + data.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  return data;
}