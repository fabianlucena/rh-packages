'use strict';

import {NoRowError, DisabledRowError} from './rf-service-errors.js';

export const ServiceMixinEnable = Service => class ServiceEnable extends Service {
    /**
     * Checks for an existent and enabled row. If the row nbot exists or is disabled throws an exception.
     * @param {object} row - test case model object to check.
     * @returns 
     */
    async checkEnabled(row) {
        if (!row)
            throw new NoRowError();

        if (!row.isEnabled)
            throw new DisabledRowError();

        return true;
    }
};