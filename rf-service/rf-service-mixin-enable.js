import { NoRowError, DisabledRowError } from './rf-service-errors.js';

export const ServiceMixinEnable = Service => class ServiceEnable extends Service {
  /**
   * Gets the options to use in getList methos.
   * @param {object} options - options for the getList method.
   * @returns {Promise[object]}
   * 
   * Common properties:
   * - view: show visible peoperties.
   */
  async getListOptions(options) {
    if (options?.isEnabled !== undefined) {
      options.where ??= {};
      options.where.isEnabled ??= options.isEnabled;

      for (const includedName in options.include) {
        options.include[includedName].where ??= {};
        options.include[includedName].where.isEnabled ??= options.isEnabled;
      }
    }

    return super.getListOptions(options);
  }

  /**
   * Checks for an existent and enabled row. If the row nbot exists or is disabled throws an exception.
   * @param {object} row - test case model object to check.
   * @returns 
   */
  async checkEnabled(row) {
    if (!row) {
      throw new NoRowError();
    }

    if (!row.isEnabled) {
      throw new DisabledRowError();
    }

    return true;
  }
};