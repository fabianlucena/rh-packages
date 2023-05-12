import {conf} from '../conf.js';
import {getSingle, completeIncludeOptions, addEnabledFilter, checkViewOptions} from 'sql-util';
import {deepComplete, spacialize, ucfirst} from 'rf-util';

export class MenuItemService {
    /**
     * Complete the data object with the permissionId property if not exists. 
     * @param {{permission: string, permissionId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completePermissionId(data) {
        if (!data.permissionId && data.permission)
            data.permissionId = await conf.global.services.Permission.getIdForName(data.permission);

        return data;
    }
    
    /**
     * Complete the data object with the parentId property if not exists. 
     * @param {{parent: string, parentId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completeParentId(data) {
        if (!data.parentId && data.parent) {
            let parentMenuItem = await MenuItemService.getForName(data.parent, {skipNoRowsError: true});
            if (!parentMenuItem) {
                await MenuItemService.create({
                    isEnabled: true,
                    name: data.parent,
                    label: ucfirst(spacialize(data.parent)),
                });

                parentMenuItem = await MenuItemService.getForName(data.parent, {skipNoRowsError: true});
            }

            if (parentMenuItem)
                data.parentId = parentMenuItem.id;
        }

        return data;
    }
    
    /**
    * Gets a menu item ID for its name. For many coincidences and for no rows this method fails.
    * @param {string} name - name for the menu item type to get.
    * @param {Options} options - Options for the @ref getList method.
    * @returns {Promise{Permission}}
    */
    static async getIdForName(name, options) {
        const menuItem = await MenuItemService.getForName(name, {...options, attributes: ['id']});
        if (!menuItem)
            return null;

        return menuItem.id;
    }
    
    /**
     * Creates a new MenuItem row into DB.
     * @param {
     *  uuid: UUID,
     *  isEnabled: BOOLEAN,
     *  name: string
     *  label: string
     *  service: string
     *  action: string
     * } data - data for the new MenuItem.
     * @returns {Promise{MenuItem}}
     */
    static async create(data) {
        await MenuItemService.completePermissionId(data);
        await MenuItemService.completeParentId(data);
    
        return conf.global.models.MenuItem.create(data);
    }

    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
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

    /**
     * Gets a list of menuItem.
     * @param {Options} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    static async getList(options) {
        return conf.global.models.MenuItem.findAll(await MenuItemService.getListOptions(options));
    }

    /**
     * Gets a menuItem for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{MenuItem}}
     */
    static async getForName(name, options) {
        const rowList = await MenuItemService.getList(deepComplete(options, {where: {name}, limit: 2}));
        return getSingle(rowList, options);
    }

    /**
     * Creates a new MenuItem row into DB if not exists.
     * @param {data} data - data for the new MenuItem.
     * @returns {Promise{MenuItem}}
     */
    static async createIfNotExists(data, options) {
        const menuItem = await MenuItemService.getForName(data.name, deepComplete(options, {skipNoRowsError: true, attributes:['id']}));
        if (menuItem)
            return menuItem;
            
        return MenuItemService.create(data);
    }
}