import { BaseError } from 'rf-util';

export class ForbidenMethodError extends BaseError {
  constructor(message) {
    super({ message });
  }
}