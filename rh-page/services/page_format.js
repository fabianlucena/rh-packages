import {conf} from '../conf.js';
import {ServiceIdUuidNameEnabledTranslatable} from 'rf-service';
import {addEnabledFilter} from 'sql-util';
import {CheckError, checkParameterStringNotNullOrEmpty, checkValidUuidOrNull} from 'rf-util';
import {ConflictError} from 'http-util';
import {loc} from 'rf-locale';

export class PageFormatService extends ServiceIdUuidNameEnabledTranslatable {
    sequelize = conf.global.sequelize;
    model = conf.global.models.PageFormat;
    defaultTranslationContext = 'pageFormat';

    async validateForCreation(data) {
        if (data.id) {
            throw new CheckError(loc._cf('pageFormat', 'ID parameter is forbidden for creation.'));
        }

        checkParameterStringNotNullOrEmpty(data.name, loc._cf('pageFormat', 'Name'));
        checkParameterStringNotNullOrEmpty(data.title, loc._cf('pageFormat', 'Title'));

        checkValidUuidOrNull(data.uuid);

        if (await this.getForName(data.name, {skipNoRowsError: true})) {
            throw new ConflictError(loc._cf('pageFormat', 'Exists another page format with that name.'));
        }

        return true;
    }
    
    /**
     * Gets the options for use in the getList and getListAndCount methods.
     * @param {Options} options - options for the @see sequelize.findAll method.
     *  - view: show visible peoperties.
     * @returns {options}
     */
    async getListOptions(options) {
        if (options.q) {
            const q = `%${options.q}%`;
            const Op = conf.global.Sequelize.Op;
            options.where = {
                [Op.or]: [
                    {name:  {[Op.like]: q}},
                    {title: {[Op.like]: q}},
                ],
            };
        }

        if (options.isEnabled !== undefined) {
            options = addEnabledFilter(options);
        }

        return options;
    }
}