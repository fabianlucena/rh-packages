export { Op } from './rf-service-op.js';
import Service from './rf-service-service.js';

function OptionalService(options) {
  return {
    ...options,
    optional: true
  };
}

export {
  OptionalService,
  Service,
};
