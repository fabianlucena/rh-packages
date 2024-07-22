import { checkParameterStringNotNullOrEmpty, trim } from 'rf-util';

export const ServiceMixinTitle = Service => class extends Service {
  constructor() {
    super();

    this.searchColumns ??= [];
    this.searchColumns.push('title');

    this.translatableColumns ??= [];
    this.translatableColumns.push('title');
  }

  async validateForCreation(data) {
    checkParameterStringNotNullOrEmpty(trim(data?.title), loc => loc._c('service', 'Title'));
    return super.validateForCreation(data);
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
      throw new Error(loc => loc._c('service', 'Invalid value for title to get row'));
    }

    if (Array.isArray(title)) {
      return this.getList({ ...options, where: { ...options?.where, title }});
    }
            
    return this.getSingleFor({ title }, options);
  }
};