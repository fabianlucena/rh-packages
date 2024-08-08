import { Op } from './rf-service-op.js';

export const ServiceMixinOwnerModule = Service => class ServiceModule extends Service {
  init() {
    if (!this.references.ownerModule) {
      this.references.ownerModule = {
        service: 'moduleService',
        createIfNotExists: true,
        whereColumn: 'name',
      };
    }

    super.init();
  }

  async getListOptions(options) {
    if (options?.isEnabled !== undefined) {
      options = { include: {}, ...options };
      options.include.ownerModule = {
        required: false,
        attributes: [],
        where: {
          [Op.or]: [
            { id: { [Op.eq]: null }},
            { isEnabled: { [Op.eq]: options?.isEnabled ?? true }},
          ],
        },
        ...options.include.ownerModule,
      };
    }

    return super.getListOptions(options);
  }
};