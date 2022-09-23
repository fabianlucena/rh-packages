const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');

const MenuItemService = {
    /**
     * Complete the data object with the permissionId property if not exists. 
     * @param {{permission: string, permissionId: integer, ...}} data 
     * @returns {Promise{data}}
     */
    async completePermissionId(data) {
        if (!data.permissionId)
            if (!data.permission)
                throw new sqlUtil.MissingPropertyError('Permission', 'permission', 'permissionId');
            else
                data.permissionId = await conf.global.services.permission.getIdForName(data.permission);

        return data;
    },
    
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
    async create(data) {
        await MenuItemService.completePermissionId(data);
        return conf.global.models.MenuItem.create(data);
    },

    /**
     * Gets a list of menuItem. If not isEnabled filter provided returns only the enabled menuItem.
     * @param {Opions} options - options for the @ref sequelize.findAll method.
     * @returns {Promise{MenuItemList}}
     */
    async getList(options) {
        options = ru.deepComplete(options, {where: {isEnabled: true}, include: []});
        return conf.global.models.MenuItem.findAll(options);
    },

    /**
     * Gets a menuItem for its name. For many coincidences and for no rows this method fails.
     * @param {string} name - name for the role type to get.
     * @param {Options} options - Options for the @ref getList method.
     * @returns {Promise{MenuItem}}
     */
    async getForName(name, options) {
        const rowList = await MenuItemService.getList(ru.deepComplete(options, {where: {name: name}, limit: 2}));
        return sqlUtil.getSingle(rowList, options);
    },

    /**
     * Creates a new MenuItem row into DB if not exists.
     * @param {data} data - data for the new MenuItem.
     * @returns {Promise{MenuItem}}
     */
    async createIfNotExists(data, options) {
        const menuItem = await MenuItemService.getForName(data.name, ru.deepComplete(options, {skipNoRowsError: true, attributes:['id']}));
        if (menuItem)
            return menuItem;
            
        return conf.global.models.MenuItem.create(data);
    },
};

module.exports = MenuItemService;