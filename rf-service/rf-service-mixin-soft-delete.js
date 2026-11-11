export const ServiceMixinSoftDelete = Service => class ServiceSoftDelete extends Service {
  async getListOptions(options) {
    options = await super.getListOptions(options);
    options.where ??= {};
    if (options.where.deletedAt === undefined) {
      options.where.deletedAt = null;
    }
    return options;
  }

  async getOptions(options) {
    options = super.getOptions ? await super.getOptions(options) : options;
    options.where ??= {};
    if (options.where.deletedAt === undefined) {
      options.where.deletedAt = null;
    }
    return options;
  }

  async delete(options) {
    const now = new Date().toISOString();
    return await this.update({ deletedAt: now }, options);
  }  
};