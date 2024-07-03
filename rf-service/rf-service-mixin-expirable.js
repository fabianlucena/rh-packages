export const ServiceMixinExpirable = Service => class ServiceExpirable extends Service {
  async delete(options) {
    return await this.update({ expiredAt: new Date() }, options);
  }
};