export const ServiceMixinIdEnable = Service => class ServiceIdEnable extends Service {
  /**
   * Enables a row for a given ID.
   * @param {string} id - ID for the row to enable.
   * @returns {Promise[integer]} enabled rows count.
   */
  async enableForId(id) {
    return await this.updateForId({ isEnabled: true }, id);
  }

  /**
   * Disables a row for a given ID.
   * @param {string} id - ID for the row to disable.
   * @returns {Promise[integer]} disabled rows count.
   */
  async disableForId(id) {
    return await this.updateForId({ isEnabled: false }, id);
  }
};