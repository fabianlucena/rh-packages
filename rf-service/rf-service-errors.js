import { BaseError } from 'rf-util/rf-util-error.js';

export class ReferenceDefinitionError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class ReferenceError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NoRowsError extends BaseError {
  constructor(options) {
    super(options);
    this.message ??= loc => loc._c('service', 'There are no rows.');
  }
}

export class NoRowError extends BaseError {
  message = loc => loc._c('service', 'There are no rows.');
}

export class ManyRowsError extends BaseError {
  static noObjectValues = ['length'];
  static visibleProperties = ['message', 'title', 'length'];
  message = loc => loc._c('service', 'There are many rows.');

  constructor(message, length) {
    super({
      message,
      length,
    });
  }
}

export class DisabledRowError extends BaseError {
  message = loc => loc._c('service', 'Object is disabled.');

  constructor(message) {
    super({ message });
  }
}

export class CheckError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NoSharedObjectError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NoSharedServiceError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class InvalidValueError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NonExistentError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NotEnabledError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class QueryError extends BaseError {
  constructor(message) {
    super({ message });
  }
}