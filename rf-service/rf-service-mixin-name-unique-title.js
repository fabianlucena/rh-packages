export const ServiceMixinNameUniqueTitle = Service => class extends Service {
  async validateForCreation(data) {
    if (data.title === undefined) {
      data.title = data.name;
    }

    return super.validateForCreation(data);
  }
};