export const ServiceMixinDescription = Service => class ServiceDescription extends Service {
    constructor() {
        super();

        this.searchColumns ??= [];
        this.searchColumns.push('description');

        this.translatableColumns ??= [];
        this.translatableColumns.push('description');
    }
};