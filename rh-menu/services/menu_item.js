import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {completeIncludeOptions, checkViewOptions} from 'sql-util';
import {spacialize, ucfirst} from 'rf-util';

export class MenuItemService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.MenuItem;
    references = {
        permission: conf.global.services.Permission,
        parent: conf.global.services.MenuItem,
    };
    defaultTranslationContext = 'menu';

    async validateForCreation(data) {
        if (!data.parentId && data.parent) {
            const parentMenuItem = await MenuItemService.singleton().create({
                isEnabled: true,
                name: data.parent,
                label: ucfirst(spacialize(data.parent)),
            });

            data.parentId = parentMenuItem.id;
        }

        return super.validateForCreation(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options?.view) {
            if (!options.attributes) {
                options.attributes = ['uuid', 'name', 'jsonData', 'isTranslatable', 'data'];
            }
            
            completeIncludeOptions(
                options,
                'Parent',
                {
                    model: conf.global.models.MenuItem,
                    as: 'Parent',
                    required: false,
                    attributes: ['name'],
                    where: {isEnabled: true}}
            );

            checkViewOptions(options);
        }

        return super.getListOptions(options);
    }

    async getList(options) {
        if (!options.includeParentAsMenuItem) {
            return super.getList(options);
        }
        
        const result = await super.getList(options);
        const rawRows = options?.withCount?
            result.rows:
            result;

        const menuItems = rawRows.map(menuItem => menuItem.toJSON());

        const menuItemsName = menuItems.map(menuItem => menuItem.name).filter(menuItemName => menuItemName);
        let parentsNameToLoad = [];
        for (const menuItem of menuItems) {
            const parentName = menuItem.Parent?.name;
            if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
                continue;
            }

            parentsNameToLoad.push(menuItem.Parent.name);
        }

        completeIncludeOptions(
            options,
            'Permission',
            {
                model: conf.global.models.Permission,
                required: false,
            }
        );

        const parentOptions = {
            where: {},
            ...options,
            withCount: undefined,
            includeParentAsMenuItem: undefined
        };

        while (parentsNameToLoad.length) {
            parentOptions.where.name = parentsNameToLoad;
            const parentMenuItemsRaw = await super.getList(parentOptions);
            if (!parentMenuItemsRaw.length) {
                break;
            }

            const parentMenuItems = parentMenuItemsRaw.map(menuItem => menuItem.toJSON());

            menuItems.splice(0, 0, ...parentMenuItems);
            menuItemsName.splice(0, 0, ...parentMenuItems.map(menuItem => menuItem.name).filter(menuItemName => menuItemName));
            
            parentsNameToLoad = [];
            for (const menuItem of menuItems) {
                const parentName = menuItem.Parent?.name;
                if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
                    continue;
                }

                parentsNameToLoad.push(menuItem.Parent.name);
            }
        }

        if (options?.withCount) {
            return {length: result.length, menuItems};
        }

        return menuItems;
    }
}