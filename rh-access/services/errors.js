import { BaseError } from 'rf-util';

export class ForbiddenMethodError extends BaseError {
  constructor(message) {
    super({ message });
  }
}