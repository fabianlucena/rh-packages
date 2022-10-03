const conf = require('../index');
const sqlUtil = require('sql-util');
const ru = require('rofa-util');
const crypto = require('crypto');

ru.complete(
    conf,
    {
        deviceCache: {},
        deviceCacheValidityTime: 60000,
        deviceCacheMaxLength: 10000,
        deviceCacheMaintenanceInterval: 10000,
        deviceCacheMaintenanceMethod: () => {
            const expiration = new Date(Date.now() - conf.deviceCacheValidityTime);
            const list = [];
            for (const authToken in conf.deviceCache) {
                const item = conf.deviceCache[authToken];
                if (item.lastUse < expiration) {
                    delete conf.deviceCache[authToken];
                } else {
                    list.push({
                        authToken: authToken,
                        lastUse: conf.deviceCache[authToken].lastUse,
                    });
                }
            }

            list.sort((a, b) => a.lastUse - b.lastUse);
            list.slice(conf.deviceCacheMaxLength).forEach(item => delete conf.deviceCache[item.authToken]);
        },
    }
);

conf.init.push(() => conf.deviceCacheMaintenance = setInterval(conf.deviceCacheMaintenanceMethod, conf.deviceCacheMaintenanceInterval));

const DeviceService = {
    /**
     * Creates a new device into DB.
     * @param {{cookie: string, data: JSON}} data - data of the new device.
     * @returns {Promise{Device}}
     */
    create(data) {
        if (!data.cookie)
            data.cookie = crypto.randomBytes(64).toString('hex');

        return conf.global.models.Device.create(data);
    },

    /**
     * Gets a list of devices.
     * @param {Options} options - options for the @see sequelize.findAll method.
     * @returns {Promise{DeviceList}]
     */
    getList(options) {
        return conf.global.models.Device.findAll(ru.complete(options, {}));
    },

    /**
     * Gets a device for a given cookie value. For many coincidences and for no rows this method fails.
     * @param {string} cookie - value for the cookie to get the device.
     * @param {Options} options - Options for the @see getList method.
     * @returns {Promise{Device}}
     */
    getForCookie(cookie, options) {
        return this.getList(ru.deepComplete(options, {where:{cookie: cookie}, limit: 2}))
            .then(rowList => sqlUtil.getSingle(rowList, ru.deepComplete(options, {params: ['devices', 'cookie', cookie, 'Device']})));
    },

    /**
     * Get a device for a given cookie value from the cache or from the DB. @see getForCookie method.
     * @param {string} cookie - value for the cookie to get the device.
     * @returns {Promise{Device}}
     */
    getForCookieCached(cookie) {
        if (conf.deviceCache && conf.deviceCache[cookie]) {
            const deviceData = conf.deviceCache[cookie];
            deviceData.lastUse = Date.now();
            return new Promise(resolve => resolve(deviceData.device));
        }

        return this.getForCookie(cookie)
            .then(device => new Promise(resolve => {
                conf.deviceCache[cookie] = {
                    device: device,
                    lastUse: Date.now(),
                };

                resolve(device);
            }));
    },
};

module.exports = DeviceService;
    