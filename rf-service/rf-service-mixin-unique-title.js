import { Op } from './rf-service.js';
import { checkParameterStringNotNullOrEmpty, checkParameterStringUndefinedOrNotNullAndNotEmpty, trim } from 'rf-util';
import { ConflictError } from 'http-util';
import { InvalidValueError } from './rf-service-errors.js';

export const ServiceMixinUniqueTitle = Service => class extends Service {
  constructor() {
    super();

    this.searchColumns ??= [];
    this.searchColumns.push('title');

    this.translatableColumns ??= [];
    this.translatableColumns.push('title');
  }

  async validateForCreation(data) {
    checkParameterStringNotNullOrEmpty(trim(data?.title), loc => loc._c('service', 'Title'));
    await this.checkTitleForConflict(data.title, data);
    return super.validateForCreation(data);
  }

  async checkTitleForConflict(title, data, where) {
    const forOption = { title };
    if (where) {
      forOption[Op.not] = where;
    }

    const rowsCount = await this.countFor(forOption);
    if (rowsCount) {
      throw new ConflictError(loc => loc._c(
        'service',
        'Exists another row with the title "%s", in "%s".',
        title,
        this.name,
      ));
    }
  }

  async validateForUpdate(data, where) {
    checkParameterStringUndefinedOrNotNullAndNotEmpty(data.title, loc => loc._c('service', 'Title'));
    if (data.title) {
      if (!where) {
        throw new ConflictError(loc => loc._c('service', 'Title update without where clause is forbiden.'));
      }

      const rowsCount = await this.countFor(where);
      if (rowsCount > 1) {
        throw new ConflictError(loc => loc._c('service', 'Title update for many rows is forbiden.'));
      }

      await this.checkTitleForConflict(data.title, data, where);
    }

    return super.validateForUpdate(data);
  }

  /**
   * Gets a row for its title. For many coincidences and for no rows this 
   * function fails.
   * @param {string|Array} title - title for the row to get.
   * @param {Options} options - Options for the @ref getList function.
   * @returns {Promise[row]}
   * 
   * If the title parammeter is a string return a single row or throw an exception.
   * But if the title parameter is a array can return a row list.
   * 
   * This function uses @ref getSingle function so the options for getSingle
   * function can be specified.
   */
  async getForTitle(title, options) {
    if (title === undefined) {
      throw new InvalidValueError(loc => loc._c('service', 'Invalid value for title to get row'));
    }

    if (Array.isArray(title)) {
      return this.getList({ ...options, where: { ...options?.where, title }});
    }
            
    return this.getSingleFor({ title }, options);
  }
};