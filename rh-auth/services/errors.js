import { BaseError } from 'rf-util';

export class NoUserError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NoOldSessionError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class InvalidTokenError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class InvalidDeviceError extends BaseError {
  constructor(message) {
    super({ message });
  }
}