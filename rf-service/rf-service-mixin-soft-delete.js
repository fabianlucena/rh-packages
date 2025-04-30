export const ServiceMixinSoftDelete = Service => class ServiceSoftDelete extends Service {
  async getOptions(options) {
    options = await super.getOptions(options);
    options.where = { deletedAt: null, ...options.where };
    return options;
  }

  async delete(options) {
    const now = new Date().toISOString();
    return await this.update({ deletedAt: now }, options);
  }  
};