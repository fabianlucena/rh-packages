export const ServiceMixinIdEnable = Service => class ServiceIdEnable extends Service {
  /**
   * Enables a row for a given ID.
   * @param {string} uuid - ID for the row to enable.
   * @returns {Promise[integer]} enabled rows count.
   */
  async enableForId(uuid) {
    return await this.updateForId({ isEnabled: true }, uuid);
  }

  /**
   * Disables a row for a given ID.
   * @param {string} uuid - ID for the row to disable.
   * @returns {Promise[integer]} disabled rows count.
   */
  async disableForId(uuid) {
    return await this.updateForId({ isEnabled: false }, uuid);
  }
};