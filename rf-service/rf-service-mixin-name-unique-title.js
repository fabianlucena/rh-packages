export const ServiceMixinNameUniqueTitle = Service => class extends Service {
  async validateForCreation(data) {
    if (typeof data.title === 'undefined') {
      data.title = data.name;
    }

    return super.validateForCreation(data);
  }
};