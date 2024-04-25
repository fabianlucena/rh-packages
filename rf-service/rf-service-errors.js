import { setUpError } from 'rf-util/rf-util-error.js';
import { loc } from 'rf-locale';

export class NoRowsError extends Error {
  static _message = loc._f('There are no rows.');

  constructor(message) {
    super();
    setUpError(
      this,
      {
        message,
      }
    );
  }
}

export class NoRowError extends Error {
  static _message = loc._f('There are no rows.');

  constructor(message) {
    super();
    setUpError(
      this,
      {
        message,
      }
    );
  }
}

export class ManyRowsError extends Error {
  static NoObjectValues = ['length'];
  static VisibleProperties = ['message', 'title', 'length'];
  static _message = loc._f('There are many rows.');

  constructor(message, length) {
    super();
    setUpError(
      this,
      {
        message,
        length,
      }
    );
  }
}

export class DisabledRowError extends Error {
  static _message = loc._f('Object is disabled.');

  constructor(message) {
    super();
    setUpError(
      this,
      {
        message,
      }
    );
  }
}

export class CheckError extends Error {
  static VisibleProperties = ['message'];

  constructor(message, options, ...params) {
    super();
    setUpError(
      this,
      {
        message: message,
        options: options,
        params: params
      }
    );
  }
}

export function format(text, ...params) {
  if (!text) {
    return text;
  }

  text = text.replace(/%%/g, '%');
  for (const replacement of params) {
    text = text.replace('%s', replacement);
  }

  return text;
}

export class _Error extends Error {
  static VisibleProperties = ['message'];

  constructor(message, ...params) {
    super();
    setUpError(
      this,
      {
        _message: message,
        params
      }
    );
  }

  get message() {
    return format(...this._message);
  }
}