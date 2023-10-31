import {_Error} from 'rf-util';
import {addEnabledOwnerModuleFilter} from 'sql-util';
import {loc} from 'rf-locale';

export const ServiceMixinModule = Service => class ServiceModule extends Service {
    /**
     * Complete the data object with the ownerModuleId property if not exists. 
     * @param {{module: string, moduleId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completeOwnerModuleId(data) {
        if (!data.ownerModuleId && data.ownerModule) {
            data.ownerModuleId = await this.moduleService.getIdForName(data.ownerModule);
        }

        return data;
    }

    async validate(data) {
        this.completeOwnerModuleId(data);
        return super.validate(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options?.isEnabled !== undefined) {
            if (!this.moduleModel) {
                throw new _Error(loc._f('No moduleModel defined.'));
            }

            options = addEnabledOwnerModuleFilter(options, this.moduleModel);
        }

        return super.getListOptions(options);
    }
};