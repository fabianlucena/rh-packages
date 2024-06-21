import { conf } from '../conf.js';
import { ServiceIdUuid } from 'rf-service';
import { getSingle } from 'sql-util';
import { complete } from 'rf-util';
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

export class DeviceService extends ServiceIdUuid {
  async validateForCreation(data) {
    data ??= {};
    data.token ||= crypto.randomBytes(64)
      .toString('base64')
      .replaceAll('=', '');

    return super.validateForCreation(data);
  }

  /**
   * Gets a device for a given token value. For many coincidences and for no rows this method fails.
   * @param {string} token - value for the token to get the device.
   * @param {Options} options - Options for the @see getList method.
   * @returns {Promise[Device]}
   */
  async getForToken(token, options) {
    if (Array.isArray(token)) {
      return this.getList({ ...options, where: { ...options?.where, token }});
    }
            
    const rows = await this.getList({ ...options, where: { ...options?.where, token }, limit: 2 });

    return getSingle(rows, { params: ['devices', 'token', token, 'Device'], ...options });
  }

  async getForTokenOrNull(token, options) {
    return this.getForToken(token, { ...options, skipNoRowsError: true });
  }

  /**
   * Get a device for a given token value from the cache or from the DB. @see getForToken method.
   * @param {string} token - value for the token to get the device.
   * @returns {Promise[Device]}
   */
  async getForTokenCached(token) {
    if (conf.deviceCache && conf.deviceCache[token]) {
      const deviceData = conf.deviceCache[token];
      deviceData.lastUse = Date.now();
      return deviceData.device;
    }

    const device = this.getForToken(token);
    conf.deviceCache[token] = {
      device: device,
      lastUse: Date.now(),
    };

    return device;
  }
}
    