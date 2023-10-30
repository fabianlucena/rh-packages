import {ServiceIdUuidNameEnableTranslatable} from './rf-service-is-uuid-name-title-enabled-module-translatable.js';
import {checkDataForMissingProperties, addEnabledFilter, addEnabledOnerModuleFilter} from 'sql-util';

export class ServiceIdUuidNameTitleEnabledModuleTranslatable extends ServiceIdUuidNameEnableTranslatable {
    searchColumn = ['name', 'title', 'description'];

    async validateForCreation(data) {
        return await checkDataForMissingProperties(data, this.constructor.name, 'name', 'title', 'description');
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        options ??= {};

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            if (this.Module) {
                options = addEnabledOnerModuleFilter(options, this.Module);
            }
        }

        return super.getListOptions(options);
    }
}