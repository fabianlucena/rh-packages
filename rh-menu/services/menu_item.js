import {conf} from '../conf.js';
import {MissingPropertyError, getSingle} from 'sql-util';
import {deepComplete} from 'rofa-util';

export class MenuItemService {
    /**
     * Complete the data object with the permissionId property if not exists. 
     * @param {{permission: string, permissionId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    static async completePermissionId(data) {
        if (!data.permissionId)
            if (!data.permission)
                throw new MissingPropertyError('Permission', 'permission', 'permissionId');
            else
                data.permissionId = await conf.global.services.permission.getIdForName(data.permission);

        return data;
    }
    
    /**
     * Creates a new MenuItem row into DB.
     * @param {
     *  uuid: UUID,
     *  isEnabled: BOOLEAN,
     *  name: string
     *  title: string
     *  service: string
     *  action: string
     * } data - data for the new MenuItem.
     * @returns {Promise{MenuItem}}
     */
    static async create(data) {
        await MenuItemService.completePermissionId(data);
        return conf.global.models.MenuItem.create(data);
    }

    /**
     * Gets a list of menuItem. If not isEnabled filter provided returns only the enabled menuItem.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    static async getList(options) {
        options = deepComplete(options, {where: {isEnabled: true}, include: []});
        return conf.global.models.MenuItem.findAll(options);
    }

    /**
     * Gets a menuItem for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{MenuItem}}
     */
    static async getForName(name, options) {
        const rowList = await MenuItemService.getList(deepComplete(options, {where: {name: name}, limit: 2}));
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
            
        return conf.global.models.MenuItem.create(data);
    }
}