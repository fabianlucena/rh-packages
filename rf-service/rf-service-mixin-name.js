import { CheckError, checkParameterStringNotNullOrEmpty, trim } from 'rf-util';
import { ConflictError } from 'http-util';
import { InvalidValueError } from './rf-service-errors.js';

export const ServiceMixinName = Service => class extends Service {
  constructor() {
    super();

    this.searchColumns ??= [];
    this.searchColumns.push('name');
  }

  async validateForCreation(data) {
    checkParameterStringNotNullOrEmpty(trim(data?.name), loc => loc._c('service', 'Name'));
    await this.checkNameForConflict(data.name, data);
    return super.validateForCreation(data);
  }

  async checkNameForConflict(name) {
    const rows = await this.getFor({ name }, { limit: 1 });
    if (rows?.length) {
      throw new ConflictError(loc => loc._c('service', 'Exists another row with that name.'));
    }
  }

  async validateForUpdate(data, where) {
    if (data.name) {
      throw new CheckError(loc => loc._c('service', 'Name parameter is forbidden for update.'));
    }

    return super.validateForUpdate(data, where);
  }

  /**
   * Gets a row for its name. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} name - name for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   * 
   * If the name parameter is a string return a single row or throw an exception.
   * But if the name parameter is a array can return a row list.
   * 
   * This function uses @ref getSingle function so the options for getSingle
   * function can be specified.
   */
  async getForName(name, options) {
    if (name === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for name to get row in %s.'));
    }

    return this.getList({ ...options, where: { ...options?.where, name }});
  }

  async getSingleForName(name, options) {
    if (name === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for name to get row in %s.'));
    }

    return this.getSingle({ ...options, where: { ...options?.where, name }});
  }

  async getSingleOrNullForName(name, options) {
    if (name === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for name to get row in %s.'));
    }
    
    return this.getSingleForName(name, { skipNoRowsError: true, nullOnManyRowsError: true, ...options });
  }

  /**
   * Creates a new row into DB if not exists.
   * @param {object} data - data for the row @see create.
   * @param {object} options - options for getForName method and for transaction in creation phase.
   * @returns {Promise[row]}
   */
  async createIfNotExists(data, options) {
    options = {
      ...options,
      where: {
        ...options?.where,
        name: data.name,
      },
    };
    
    return super.createIfNotExists(data, options);
  }

  async update(data, options) {
    if (!options?.where && data.name) {
      options ??= {};
      options.where = { name: data.name };
      data = { ...data, name: undefined };
    }

    return super.update(data, options);
  }
};