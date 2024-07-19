import { BaseError } from 'rf-util';

export class ForbidenDeleteAttributeValueError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class ForbidenUpdateAttributeValueError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class AttributeDefinitionError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class UpdateAttributeValueError extends BaseError {
  constructor(message) {
    super({ message });
  }
}

export class NoAttributeForTagCreationError extends BaseError {
  constructor(message) {
    super({ message });
  }
}