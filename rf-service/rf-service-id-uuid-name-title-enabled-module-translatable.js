import {ServiceIdUuidNameEnableTranslatable} from './rf-service-primary.js';
import {checkDataForMissingProperties, addEnabledFilter, addEnabledOnerModuleFilter} from 'sql-util';

export class ServiceIdUuidNameTitleEnabledModuleTranslatable extends ServiceIdUuidNameEnableTranslatable {
    searchColumn = ['name', 'title'];

    async validateForCreation(data) {
        return await checkDataForMissingProperties(data, this.constructor.name, 'name', 'title');
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