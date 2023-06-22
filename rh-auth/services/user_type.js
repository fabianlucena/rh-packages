'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {addEnabledFilter, addEnabledOnerModuleFilter, checkDataForMissingProperties} from 'sql-util';

export class UserTypeService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.UserType;
    defaultTranslationContext = 'userType';

    async validateForCreation(data) {
        await checkDataForMissingProperties(data, 'UserType', 'name', 'title');

        return true;
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        options ??= {};

        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {username:    {[Op.like]: q}},
                    {displayName: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
            if (conf.global.models.Module)
                options = addEnabledOnerModuleFilter(options, conf.global.models.Module);
        }

        return options;
    }
}