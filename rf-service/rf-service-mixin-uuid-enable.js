'use strict';

export const ServiceMixinUuidEnable = Service => class ServiceUuidEnable extends Service {
    /**
     * Enables a row for a given UUID.
     * @param {string} uuid - UUID for the row o enable.
     * @returns {Promise[integer]} enabled rows count.
     */
    async enableForUuid(uuid) {
        return await this.updateForUuid({isEnabled: true}, uuid);
    }

    /**
     * Disables a row for a given UUID.
     * @param {string} uuid - UUID for the row o disable.
     * @returns {Promise[integer]} disabled rows count.
     */
    async disableForUuid(uuid) {
        return await this.updateForUuid({isEnabled: false}, uuid);
    }
};