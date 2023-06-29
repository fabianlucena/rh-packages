'use strict';

import {conf} from '../conf.js';
import {Service} from 'rf-service';
import {completeIncludeOptions, addEnabledFilter, checkViewOptions} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull, spacialize, ucfirst} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class MenuItemService extends Service {
    sequelize = conf.global.sequelize;
    model = conf.global.models.MenuItem;
    references = {
        permission: conf.global.services.Permission,
        parent: conf.global.services.MenuItem,
    };
    defaultTranslationContext = 'menu';

    async validateForCreation(data) {
        if (data.id)
            throw new CheckError(loc._cf('menuItem', 'ID parameter is forbidden for creation.'));

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('menuItem', 'Name'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {skipNoRowsError: true}))
            throw new ConflictError(loc._cf('menuItem', 'Exists another test scenary with that name.'));

        if (!data.parentId && data.parent) {
            const parentMenuItem = await MenuItemService.singleton().create({
                isEnabled: true,
                name: data.parent,
                label: ucfirst(spacialize(data.parent)),
            });

            data.parentId = parentMenuItem.id;
        }

        return true;
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options.isEnabled !== undefined)
            options = addEnabledFilter(options);

        if (options.view) {
            if (!options.attributes)
                options.attributes = ['uuid', 'name', 'jsonData', 'isTranslatable', 'data'];
            
            completeIncludeOptions(options, 'Parent', {model: conf.global.models.MenuItem, as: 'Parent', required: false, attributes: ['name'], where: {isEnabled: true}});
            checkViewOptions(options);
        }

        return options;
    }
}