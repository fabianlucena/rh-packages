'use strict';

export const ServiceMixinTranslatable = Service => class ServiceTranslatable extends Service {
    /**
     * Gets a list of rows.
     * @param {object} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {Promise[Array[row]]}
     */
    async getList(options) {
        let result = super.getList(options);

        let loc;
        if (options.translate !== false)
            loc = options.loc;

        if (loc) {
            result = await result;
            if (options.withCount)
                result.rows = await this.translateRows(result.rows, loc);
            else
                result = await this.translateRows(result, loc);
        } else if (options.translate)
            console.warn('Cannot translate because no localization (loc) defined.');

        return result;
    }
};