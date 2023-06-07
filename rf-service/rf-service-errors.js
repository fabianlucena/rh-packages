'use strict';

import {loc} from 'rf-locale';
import {setUpError} from 'rf-util/rf-util-error.js';

export class NoRowsError extends Error {
    static _message = loc._f('There are no rows.');

    constructor(message) {
        super();
        setUpError(
            this,
            {
                message,
            }
        );
    }
}

export class NoRowError extends Error {
    static _message = loc._f('There are no row.');

    constructor(message) {
        super();
        setUpError(
            this,
            {
                message,
            }
        );
    }
}

export class ManyRowsError extends Error {
    static NoObjectValues = ['length'];
    static VisibleProperties = ['message', 'length'];
    static _message = loc._f('There are many rows.');

    constructor(message, length) {
        super();
        setUpError(
            this,
            {
                message,
                length,
            }
        );
    }
}

export class DisabledRowError extends Error {
    static _message = loc._f('Object is disabled.');

    constructor(message) {
        super();
        setUpError(
            this,
            {
                message,
            }
        );
    }
}