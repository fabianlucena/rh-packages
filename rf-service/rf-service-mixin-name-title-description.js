export const ServiceMixinNameTitleDescription = Service => class ServiceNameTitleDescription extends Service {
    searchColumns = ['name', 'title', 'description'];
};