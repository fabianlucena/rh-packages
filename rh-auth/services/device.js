import {conf} from '../conf.js';
import {getSingle} from 'sql-util';
import {complete, deepComplete} from 'rf-util';
import crypto from 'crypto';

complete(
    conf,
    {
        deviceCache: {},
        deviceCacheValidityTime: 60000,
        deviceCacheMaxLength: 10000,
        deviceCacheMaintenanceInterval: 10000,
        deviceCacheMaintenanceMethod: () => {
            const expiration = new Date(Date.now() - conf.deviceCacheValidityTime);
            const list = [];
            for (const deviceToken in conf.deviceCache) {
                const item = conf.deviceCache[deviceToken];
                if (item.lastUse < expiration) {
                    delete conf.deviceCache[deviceToken];
                } else {
                    list.push({
                        deviceToken: deviceToken,
                        lastUse: conf.deviceCache[deviceToken].lastUse,
                    });
                }
            }

            list.sort((a, b) => a.lastUse - b.lastUse);
            list.slice(conf.deviceCacheMaxLength).forEach(item => delete conf.deviceCache[item.deviceToken]);
        },
    }
);

conf.init.push(() => conf.deviceCacheMaintenance = setInterval(conf.deviceCacheMaintenanceMethod, conf.deviceCacheMaintenanceInterval));

export class DeviceService {
    /**
     * Creates a new device into DB.
     * @param {{token: string, data: JSON}} data - data of the new device.
     * @returns {Promise{Device}}
     */
    static create(data) {
        if (!data)
            data = {};

        if (!data.token)
            data.token = crypto.randomBytes(64).toString('hex');

        return conf.global.models.Device.create(data);
    }
    
    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    static async getListOptions(options) {
        if (!options)
            options = {};

        return options;
    }

    /**
     * Gets a list of devices.
     * @param {Options} options - options for the @see sequelize.findAll method.
     * @returns {Promise{DeviceList}]
     */
    static async getList(options) {
        return conf.global.models.Device.findAll(await DeviceService.getListOptions(options));
    }

    /**
     * Gets a device for a given token value. For many coincidences and for no rows this method fails.
     * @param {string} token - value for the token to get the device.
     * @param {Options} options - Options for the @see getList method.
     * @returns {Promise{Device}}
     */
    static getForToken(token, options) {
        return this.getList(deepComplete(options, {where:{token: token}, limit: 2}))
            .then(rowList => getSingle(rowList, deepComplete(options, {params: ['devices', 'token', token, 'Device']})));
    }

    /**
     * Get a device for a given token value from the cache or from the DB. @see getForToken method.
     * @param {string} token - value for the token to get the device.
     * @returns {Promise{Device}}
     */
    static getForTokenCached(token) {
        if (conf.deviceCache && conf.deviceCache[token]) {
            const deviceData = conf.deviceCache[token];
            deviceData.lastUse = Date.now();
            return new Promise(resolve => resolve(deviceData.device));
        }

        return this.getForToken(token)
            .then(device => new Promise(resolve => {
                conf.deviceCache[token] = {
                    device: device,
                    lastUse: Date.now(),
                };

                resolve(device);
            }));
    }
}
    