import { CheckError, checkValidUuidOrNull } from 'rf-util';
import { ConflictError } from 'http-util';
import { InvalidValueError } from './rf-service-errors.js';

export const ServiceMixinUuid = Service => class ServiceUuid extends Service {
  async validateForCreation(data) {
    checkValidUuidOrNull(data.uuid);
    if (data.uuid) {
      this.checkUuidForConflict(data.uuid, data);
    }

    return super.validateForCreation(data);
  }

  async checkUuidForConflict(uuid) {
    const rows = await this.getSingleOrNullForUuid(uuid, { skipNoRowsError: true });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('service', 'Exists another row with that UUID.'));
    }
  }

  async validateForUpdate(data, where) {
    if (data.uuid) {
      throw new CheckError(loc => loc._c('service', 'UUID parameter is forbidden for update.'));
    }

    return super.validateForUpdate(data, where);
  }

  /**
   * Gets a row for its UUID. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} uuid - UUID for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   * 
   * If the name parameter is a string return a single row or throw an exception.
   * But if the name parameter is a array can return a row list.
   * 
   * This function uses @ref getSingle function so the options for getSingle
   * function can be specified.
   */
  async getForUuid(uuid, options) {
    if (uuid === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for UUID to get row in %s.'));
    }

    return this.getList({ ...options, where: { ...options?.where, uuid }});
  }

  async getSingleForUuid(uuid, options) {
    if (uuid === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for UUID to get row in %s.'));
    }

    return this.getSingleFor({ ...options, where: { ...options?.where, uuid }});
  }

  async getSingleOrNullForUuid(uuid, options) {
    if (uuid === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for UUID to get row in %s.'));
    }
    
    return this.getSingleForUuid(uuid, { skipNoRowsError: true, ...options });
  }

  async update(data, options) {
    if (!options?.where && data.uuid) {
      options ??= {};
      options.where = { uuid: data.uuid };
      data = { ...data, uuid: undefined };
    }

    return super.update(data, options);
  }

  /**
   * Updates a row for a given UUID.
   * @param {object} data - Data to update.
   * @param {object} uuid - UUID of the row to update.
   * @returns {Promise[integer]} updated rows count.
   */
  async updateForUuid(data, uuid, options) {
    return this.updateFor(data, { uuid }, options);
  }

  /**
   * Deletes a rows for a given UUID.
   * @param {string} uuid - UUID for the test case o delete.
   * @returns {Promise[integer]} deleted rows count.
   */
  async deleteForUuid(uuid) {
    return this.deleteFor({ uuid });
  }
};