import { Op } from './rf-service-op.js';

export const ServiceMixinOwnerModule = Service => class ServiceModule extends Service {
  init() {
    if (!this.references.ownerModule) {
      this.references.ownerModule = 'moduleService';
    }

    super.init();
  }

  async getListOptions(options) {
    if (options?.isEnabled !== undefined) {
      options = { ...options };
      options.include.ownerModule = {
        ...options.include.ownerModule,
        required: false,
        skipAssociationAttributes: true,
        where: {
          [Op.or]: [
            { id: { [Op.eq]: null }},
            { isEnabled: { [Op.eq]: options?.isEnabled ?? true }},
          ],
        },
      };
    }

    return super.getListOptions(options);
  }
};